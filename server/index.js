import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import mongoose from 'mongoose';
import { connectDB } from './db.js';
import ValidationRecord from './models/ValidationRecord.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Zero-config in-memory database fallback when local MongoDB service is unavailable
const tempRecords = [];
const isDbConnected = () => mongoose.connection.readyState === 1;


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

    let clientManifest = null;
    if (req.body.clientManifest) {
      try {
        clientManifest = JSON.parse(req.body.clientManifest);
        console.log(`[SIGNET] Received clientManifest for ${originalname}`);
      } catch (e) {
        console.warn('[SIGNET] Failed to parse clientManifest payload:', e.message);
      }
    }

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
      if (req.query.simulate === 'true') {
        // Simulate C2PA manifest for standard files (Developer Mode)
        const signatureValid = Math.random() > 0.15; // 85% chance of valid signature
        const randHash = () => Array.from({length: 4}, () => Math.random().toString(16).substring(2)).join('').substring(0, 64);
        
        const provenanceChain = [
          {
            actionName: 'Content Created',
            software: 'Sony ILCE-7M4',
            softwareVersion: 'v2.01',
            timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
            operator: 'Field Officer Delta',
            signatureValid: true,
            hashAlgorithm: 'SHA-256',
            hash: 'sha256:' + randHash(),
          },
          {
            actionName: 'Color Adjusted',
            software: 'Adobe Lightroom Mobile',
            softwareVersion: 'v9.2.1',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            operator: 'Analyst Charlie',
            signatureValid: true,
            hashAlgorithm: 'SHA-256',
            hash: 'sha256:' + randHash(),
          },
          {
            actionName: 'Image Resized',
            software: 'Adobe Photoshop',
            softwareVersion: '2026 v27.4',
            timestamp: new Date().toISOString(),
            operator: 'System Server',
            signatureValid: signatureValid,
            hashAlgorithm: 'SHA-256',
            hash: 'sha256:' + randHash(),
          }
        ];

        result = {
          ...result,
          hasManifest: true,
          activeManifest: 'simulated_active_manifest',
          manifestCount: 3,
          validationStatus: signatureValid ? [] : [{ code: 'validation-failure', explanation: 'Manifest signature could not be verified' }],
          signatureValid,
          provenanceChain,
          claimGenerator: 'Sony_ILCE-7M4/2.01',
        };

        console.log(`[SIGNET] [SIMULATION] Generated C2PA mock manifest for ${originalname}`);
      } else {
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
      }
    } catch (c2paErr) {
      const errMsg = c2paErr?.message || String(c2paErr);

      // Check if client-side fallback is available
      if (clientManifest) {
        console.log(`[SIGNET] Backend validation failed (DLL/Rust err), falling back to client-side WASM results for ${originalname}`);
        result = {
          ...result,
          hasManifest: clientManifest.hasManifest,
          signatureValid: clientManifest.signatureValid,
          manifestCount: clientManifest.manifestCount,
          claimGenerator: clientManifest.claimGenerator,
          provenanceChain: clientManifest.provenanceChain,
          activeManifest: 'client_wasm_fallback',
        };
      } else if (
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


    // Persist to MongoDB (if connected) or fall back to memory
    const useDb = isDbConnected();
    if (useDb) {
      try {
        const record = new ValidationRecord(result);
        await record.save();
        result._id = record._id;
        console.log(`[SIGNET] Saved validation record to MongoDB: ${record._id}`);
      } catch (dbErr) {
        console.warn('[SIGNET] Could not save to MongoDB, falling back to memory:', dbErr.message);
        result._id = `temp-${Date.now()}`;
        tempRecords.unshift(result);
      }
    } else {
      result._id = `temp-${Date.now()}`;
      tempRecords.unshift(result);
      console.log(`[SIGNET] Saved validation record to memory: ${result._id}`);
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

// POST /api/validate-sample — Ingest a pre-configured sample C2PA evidence file for testing
app.post('/api/validate-sample', async (req, res) => {
  const sampleNum = Math.floor(Math.random() * 3) + 1;
  let sampleResult;

  const randHash = () => Array.from({length: 4}, () => Math.random().toString(16).substring(2)).join('').substring(0, 64);

  if (sampleNum === 1) {
    sampleResult = {
      fileName: 'forensic_sample_alpha.jpg',
      fileSize: 2405912,
      mimeType: 'image/jpeg',
      hasManifest: true,
      activeManifest: 'forensic_sample_alpha.jpg',
      manifestCount: 3,
      validationStatus: [],
      signatureValid: true,
      claimGenerator: 'Canon_EOS_R5/1.8.1',
      provenanceChain: [
        {
          actionName: 'Content Created',
          software: 'Canon EOS R5',
          softwareVersion: 'v1.8.1',
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
          operator: 'Special Agent Miller (ID 849)',
          signatureValid: true,
          hashAlgorithm: 'SHA-256',
          hash: 'sha256:' + randHash(),
        },
        {
          actionName: 'Image Cropped',
          software: 'Adobe Photoshop',
          softwareVersion: '2026 v27.4',
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          operator: 'Analyst Bravo',
          signatureValid: true,
          hashAlgorithm: 'SHA-256',
          hash: 'sha256:' + randHash(),
        },
        {
          actionName: 'Secure Forensic Seal',
          software: 'SIGNET Analysis Engine',
          softwareVersion: 'v0.2.0',
          timestamp: new Date().toISOString(),
          operator: 'System Agent',
          signatureValid: true,
          hashAlgorithm: 'SHA-256',
          hash: 'sha256:' + randHash(),
        }
      ],
      analyzedAt: new Date(),
    };
  } else if (sampleNum === 2) {
    sampleResult = {
      fileName: 'surveillance_capture_042.png',
      fileSize: 4183204,
      mimeType: 'image/png',
      hasManifest: true,
      activeManifest: 'surveillance_capture_042.png',
      manifestCount: 2,
      validationStatus: [{ code: 'validation-failure', explanation: 'Manifest signature is invalid: modified content' }],
      signatureValid: false,
      claimGenerator: 'Hikvision_DS-2CD2087G2/v5.5.8',
      provenanceChain: [
        {
          actionName: 'Content Created',
          software: 'Hikvision IP Camera',
          softwareVersion: 'v5.5.8',
          timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
          operator: 'Security Terminal 4',
          signatureValid: true,
          hashAlgorithm: 'SHA-256',
          hash: 'sha256:' + randHash(),
        },
        {
          actionName: 'Metadata Tampered',
          software: 'Unknown Tool',
          softwareVersion: 'N/A',
          timestamp: new Date().toISOString(),
          operator: 'External Actor',
          signatureValid: false,
          hashAlgorithm: 'SHA-256',
          hash: 'sha256:' + randHash(),
        }
      ],
      analyzedAt: new Date(),
    };
  } else {
    sampleResult = {
      fileName: 'bodycam_footage_rec.mp4',
      fileSize: 24501832,
      mimeType: 'video/mp4',
      hasManifest: true,
      activeManifest: 'bodycam_footage_rec.mp4',
      manifestCount: 1,
      validationStatus: [],
      signatureValid: true,
      claimGenerator: 'Axon_Body_3/v1.23.4',
      provenanceChain: [
        {
          actionName: 'Content Created',
          software: 'Axon Body 3',
          softwareVersion: 'v1.23.4',
          timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
          operator: 'Officer Davis (ID 7482)',
          signatureValid: true,
          hashAlgorithm: 'SHA-256',
          hash: 'sha256:' + randHash(),
        }
      ],
      analyzedAt: new Date(),
    };
  }

  try {
    const useDb = isDbConnected();
    if (useDb) {
      const record = new ValidationRecord(sampleResult);
      await record.save();
      sampleResult._id = record._id;
    } else {
      sampleResult._id = `temp-${Date.now()}`;
      tempRecords.unshift(sampleResult);
    }
    console.log(`[SIGNET] Ingested sample C2PA record: ${sampleResult.fileName}`);
    res.json(sampleResult);
  } catch (err) {
    res.status(500).json({ error: 'Failed to ingest sample validation record' });
  }
});

// GET /api/validations — Retrieve past validation records
app.get('/api/validations', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);

  if (isDbConnected()) {
    try {
      const records = await ValidationRecord.find()
        .sort({ analyzedAt: -1 })
        .limit(limit)
        .lean();
      return res.json(records);
    } catch (err) {
      console.warn('[SIGNET] Mongoose query failed, falling back to memory:', err.message);
    }
  }

  // Return in-memory fallback
  res.json(tempRecords.slice(0, limit));
});

// GET /api/validations/:id — Retrieve a single validation record
app.get('/api/validations/:id', async (req, res) => {
  const { id } = req.params;

  if (isDbConnected() && !id.startsWith('temp-')) {
    try {
      const record = await ValidationRecord.findById(id).lean();
      if (record) {
        return res.json(record);
      }
    } catch (err) {
      console.warn('[SIGNET] Mongoose findById failed, falling back to memory:', err.message);
    }
  }

  // Look in temp records
  const record = tempRecords.find(r => String(r._id) === id);
  if (!record) {
    return res.status(404).json({ error: 'Validation record not found' });
  }
  res.json(record);
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
