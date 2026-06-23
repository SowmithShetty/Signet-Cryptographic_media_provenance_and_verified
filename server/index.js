import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { connectDB } from './db.js';
import ValidationRecord from './models/ValidationRecord.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Configure multer for temp file uploads
const upload = multer({
  dest: path.join(os.tmpdir(), 'signet-uploads'),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'video/mp4'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

// ── Connect to MongoDB ───────────────────────────────────────────────
await connectDB();

// ── Helper: Parse provenance chain from C2PA manifest ────────────────
function parseProvenanceChain(manifestJson, validationStatus) {
  const chain = [];

  if (!manifestJson) return chain;

  let parsed;
  try {
    parsed = typeof manifestJson === 'string' ? JSON.parse(manifestJson) : manifestJson;
  } catch {
    return chain;
  }

  const manifests = parsed.manifests || {};
  const activeLabel = parsed.active_manifest;

  // Process all manifests in the chain
  for (const [label, manifest] of Object.entries(manifests)) {
    const isActive = label === activeLabel;
    const claimGenerator = manifest.claim_generator || '';

    // Extract software info from claim_generator_info or claim_generator
    let software = 'Unknown';
    let softwareVersion = '';

    if (manifest.claim_generator_info?.length > 0) {
      const info = manifest.claim_generator_info[0];
      software = info.name || 'Unknown';
      softwareVersion = info.version || '';
    } else if (claimGenerator) {
      // Parse "SoftwareName/Version" format
      const parts = claimGenerator.split('/');
      software = parts[0] || 'Unknown';
      softwareVersion = parts.slice(1).join('/') || '';
    }

    // Extract actions from assertions
    const actions = manifest.assertions?.filter(
      (a) => a.label === 'c2pa.actions' || a.label === 'c2pa.actions.v2'
    ) || [];

    if (actions.length > 0) {
      const actionList = actions[0]?.data?.actions || [];
      for (const action of actionList) {
        // Extract action details
        const softwareAgent = action.softwareAgent || software;
        let actionSoftware = softwareAgent;
        let actionVersion = softwareVersion;

        // Parse softwareAgent if it contains version
        if (softwareAgent.includes('/')) {
          const [name, ...versionParts] = softwareAgent.split('/');
          actionSoftware = name;
          actionVersion = versionParts.join('/');
        }

        chain.push({
          actionName: formatActionName(action.action),
          software: actionSoftware,
          softwareVersion: actionVersion,
          timestamp: action.when || manifest.signature_info?.time || new Date().toISOString(),
          operator: action.digitalSourceType ? 'System' : 'Operator',
          signatureValid: !validationStatus || validationStatus.length === 0,
          hashAlgorithm: manifest.signature_info?.alg || 'SHA-256',
          hash: manifest.signature_info?.issuer || label,
        });
      }
    } else {
      // No actions found — create a single node from manifest info
      chain.push({
        actionName: isActive ? 'Active Manifest' : 'Ingredient',
        software,
        softwareVersion,
        timestamp: manifest.signature_info?.time || new Date().toISOString(),
        operator: manifest.title || 'Unknown',
        signatureValid: !validationStatus || validationStatus.length === 0,
        hashAlgorithm: manifest.signature_info?.alg || 'SHA-256',
        hash: label,
      });
    }
  }

  return chain;
}

// Format C2PA action URIs to human-readable names
function formatActionName(action) {
  if (!action) return 'Unknown Action';

  const actionMap = {
    'c2pa.created': 'Content Created',
    'c2pa.placed': 'Content Placed',
    'c2pa.cropped': 'Image Cropped',
    'c2pa.resized': 'Image Resized',
    'c2pa.color_adjustments': 'Color Adjusted',
    'c2pa.edited': 'Content Edited',
    'c2pa.filtered': 'Filter Applied',
    'c2pa.opened': 'File Opened',
    'c2pa.published': 'Content Published',
    'c2pa.transcoded': 'Media Transcoded',
    'c2pa.drawing': 'Drawing Added',
    'c2pa.unknown': 'Unknown Edit',
  };

  return actionMap[action] || action.replace('c2pa.', '').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

// ── Routes ───────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'operational',
    service: 'SIGNET Forensic Analysis Engine',
    timestamp: new Date().toISOString(),
    version: '0.2.0',
  });
});

// POST /api/validate — Upload and validate a file for C2PA metadata
app.post('/api/validate', upload.single('file'), async (req, res) => {
  const tmpPath = req.file?.path;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, mimetype, size } = req.file;
    console.log(`[SIGNET] Validating: ${originalname} (${mimetype}, ${size} bytes)`);

    let result = {
      fileName: originalname,
      fileSize: size,
      mimeType: mimetype,
      hasManifest: false,
      activeManifest: null,
      manifestCount: 0,
      validationStatus: [],
      signatureValid: false,
      provenanceChain: [],
      claimGenerator: '',
      error: null,
      analyzedAt: new Date(),
    };

    try {
      // Dynamically import c2pa-node (native binary)
      const { Reader } = await import('@contentauth/c2pa-node');

      const reader = await Reader.fromAsset({
        path: tmpPath,
        mimeType: mimetype,
      });

      const manifestJson = reader.json();

      if (manifestJson) {
        const parsed = typeof manifestJson === 'string' ? JSON.parse(manifestJson) : manifestJson;
        const activeManifest = reader.getActive();

        // Determine validation status
        // In c2pa-node, validation_status is part of the manifest store
        const validationStatus = parsed.validation_status || [];
        const signatureValid = validationStatus.length === 0;

        // Parse the provenance chain for timeline visualization
        const provenanceChain = parseProvenanceChain(parsed, validationStatus);

        result = {
          ...result,
          hasManifest: true,
          activeManifest: activeManifest || parsed.active_manifest,
          manifestCount: Object.keys(parsed.manifests || {}).length,
          validationStatus,
          signatureValid,
          provenanceChain,
          claimGenerator: activeManifest?.claim_generator || '',
        };

        console.log(
          `[SIGNET] ✓ Manifest found: ${result.manifestCount} manifest(s), ` +
          `signature ${signatureValid ? 'VALID' : 'INVALID'}, ` +
          `${provenanceChain.length} action(s) in chain`
        );
      } else {
        console.log(`[SIGNET] ○ No C2PA manifest found in ${originalname}`);
      }
    } catch (c2paErr) {
      const errMsg = c2paErr?.message || String(c2paErr);

      // Gracefully handle files without C2PA data
      if (
        errMsg.includes('JumbfNotFound') ||
        errMsg.includes('no C2PA') ||
        errMsg.includes('Not Found') ||
        errMsg.includes('UnsupportedType')
      ) {
        console.log(`[SIGNET] ○ No C2PA metadata in ${originalname}`);
      } else {
        console.error(`[SIGNET] C2PA processing error:`, c2paErr);
        result.error = `C2PA processing error: ${errMsg}`;
      }
    }

    // Persist to MongoDB (if connected)
    try {
      const record = new ValidationRecord(result);
      await record.save();
      result._id = record._id;
      console.log(`[SIGNET] Saved validation record: ${record._id}`);
    } catch (dbErr) {
      console.warn('[SIGNET] Could not save to MongoDB:', dbErr.message);
      // Still return the result even if DB save fails
      result._id = `temp-${Date.now()}`;
    }

    res.json(result);
  } catch (err) {
    console.error('[SIGNET] Validation error:', err);
    res.status(500).json({
      error: 'Internal server error during validation',
      details: err.message,
    });
  } finally {
    // Clean up temp file
    if (tmpPath) {
      try {
        await fs.unlink(tmpPath);
      } catch {
        // File may already be cleaned up
      }
    }
  }
});

// GET /api/validations — Retrieve past validation records
app.get('/api/validations', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const records = await ValidationRecord.find()
      .sort({ analyzedAt: -1 })
      .limit(limit)
      .lean();
    res.json(records);
  } catch (err) {
    console.warn('[SIGNET] Could not fetch validations:', err.message);
    res.json([]); // Return empty array if DB is not available
  }
});

// GET /api/validations/:id — Retrieve a single validation record
app.get('/api/validations/:id', async (req, res) => {
  try {
    const record = await ValidationRecord.findById(req.params.id).lean();
    if (!record) {
      return res.status(404).json({ error: 'Validation record not found' });
    }
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch validation record' });
  }
});

// ── Error handling middleware ─────────────────────────────────────────
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum size is 500MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err.message?.includes('Unsupported file type')) {
    return res.status(415).json({ error: err.message });
  }
  console.error('[SIGNET] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start Server ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[SIGNET] Server operational on port ${PORT}`);
});
