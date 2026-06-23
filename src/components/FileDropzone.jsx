import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FileImage,
  FileVideo,
  Shield,
  X,
  CheckCircle2,
  AlertTriangle,
  Hash,
  Clock,
  Loader2,
  ShieldOff,
  Eye,
} from 'lucide-react';
import { readManifest } from '../services/c2paService';
import { validateFile, validateSampleFile } from '../services/apiService';
import { useValidation } from '../context/ValidationContext';

const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'video/mp4': ['.mp4'],
};

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(type) {
  if (type.startsWith('image/')) return FileImage;
  if (type.startsWith('video/')) return FileVideo;
  return FileImage;
}

/**
 * FileDropzone — Uploads files, extracts C2PA manifests via WASM,
 * then sends to backend for cryptographic signature verification.
 *
 * @param {function} onValidationComplete - Callback when a file completes validation
 */
export default function FileDropzone({ onValidationComplete }) {
  const [files, setFiles] = useState([]);
  const { simulationMode } = useValidation();
  const [isIngestingSample, setIsIngestingSample] = useState(false);

  const updateFile = useCallback((id, updates) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  }, []);

  const ingestSample = useCallback(async () => {
    setIsIngestingSample(true);
    const sampleId = crypto.randomUUID();
    const tempSample = {
      id: sampleId,
      name: 'forensic_sample_loading.jpg',
      size: 2405912,
      type: 'image/jpeg',
      hash: '',
      status: 'validating',
      timestamp: new Date().toISOString(),
      error: null,
      c2paMessage: 'Contacting server to ingest sample record...',
      serverResult: null,
    };
    
    setFiles((prev) => [...prev, tempSample]);

    try {
      const serverResult = await validateSampleFile();
      
      setFiles((prev) => prev.map((f) => f.id === sampleId ? {
        ...f,
        name: serverResult.fileName,
        size: serverResult.fileSize,
        type: serverResult.mimeType,
        status: serverResult.signatureValid ? 'verified' : 'invalid',
        hash: serverResult.provenanceChain?.[0]?.hash || '',
        serverResult,
        c2paMessage: serverResult.signatureValid
          ? 'Sample C2PA evidence signature verified'
          : 'Sample C2PA signature invalid (Simulated Tampering)',
      } : f));

      if (onValidationComplete) {
        onValidationComplete(serverResult);
      }
    } catch (err) {
      console.error('[SIGNET] Sample ingest failed:', err);
      setFiles((prev) => prev.map((f) => f.id === sampleId ? {
        ...f,
        status: 'error',
        error: `Sample ingestion failed: ${err.message}`,
        c2paMessage: err.message,
      } : f));
    } finally {
      setIsIngestingSample(false);
    }
  }, [onValidationComplete]);

  const processFile = useCallback(
    async (fileEntry) => {
      const { id, file } = fileEntry;

      // ── Phase 1: Client-side C2PA WASM extraction ──
      updateFile(id, { status: 'reading' });

      let clientManifest = null;
      try {
        const result = await readManifest(file);
        clientManifest = result.manifest;

        if (!clientManifest) {
          // No C2PA metadata found — still send to server for logging
          updateFile(id, {
            status: 'no-metadata',
            c2paMessage: result.message || 'No C2PA metadata found',
          });
        } else {
          updateFile(id, {
            status: 'validating',
            c2paMessage: 'C2PA manifest extracted, verifying signatures…',
          });
        }
      } catch (wasmErr) {
        console.warn('[SIGNET] WASM extraction failed:', wasmErr);
        // Continue to server validation anyway
        updateFile(id, {
          status: 'validating',
          c2paMessage: 'Client extraction skipped, sending to server…',
        });
      }

      // ── Phase 2: Server-side signature verification ──
      try {
        updateFile(id, { status: 'validating' });

        const serverResult = await validateFile(file, simulationMode, clientManifest);

        if (serverResult.hasManifest) {
          updateFile(id, {
            status: serverResult.signatureValid ? 'verified' : 'invalid',
            hash: serverResult.provenanceChain?.[0]?.hash || '',
            serverResult,
            c2paMessage: serverResult.signatureValid
              ? 'Signature cryptographically verified'
              : `Signature invalid: ${serverResult.validationStatus?.length || 0} issue(s)`,
          });
        } else {
          updateFile(id, {
            status: 'no-metadata',
            serverResult,
            c2paMessage: 'No C2PA manifest embedded in this file',
          });
        }

        // Notify parent
        if (onValidationComplete) {
          onValidationComplete(serverResult);
        }
      } catch (serverErr) {
        console.error('[SIGNET] Server validation failed:', serverErr);
        updateFile(id, {
          status: clientManifest ? 'verified' : 'error',
          error: `Server validation failed: ${serverErr.message}`,
          c2paMessage: clientManifest
            ? 'Client-side extraction succeeded but server verification unavailable'
            : serverErr.message,
        });
      }
    },
    [updateFile, onValidationComplete, simulationMode]
  );

  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const rejected = rejectedFiles.map((r) => ({
          id: crypto.randomUUID(),
          file: r.file,
          name: r.file.name,
          size: r.file.size,
          type: r.file.type,
          hash: '',
          status: 'error',
          timestamp: new Date().toISOString(),
          error: r.errors[0]?.message || 'Invalid file',
          c2paMessage: null,
          serverResult: null,
        }));
        setFiles((prev) => [...prev, ...rejected]);
      }

      // Handle accepted files
      const newFiles = acceptedFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        hash: '',
        status: 'queued',
        timestamp: new Date().toISOString(),
        error: null,
        c2paMessage: null,
        serverResult: null,
      }));

      setFiles((prev) => [...prev, ...newFiles]);

      // Start processing each file
      newFiles.forEach((fileEntry) => {
        processFile(fileEntry);
      });
    },
    [processFile]
  );

  const removeFile = useCallback((id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: ACCEPTED_TYPES,
      maxSize: MAX_FILE_SIZE,
      multiple: true,
    });

  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in-up">
      {/* ── Section Header ──────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-[var(--color-neon)]" />
          <h1
            className="text-base font-semibold tracking-wider text-white uppercase"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Evidence Ingest
          </h1>
        </div>
        <p className="text-xs text-[var(--color-slate-mid)] leading-relaxed">
          Upload digital evidence for cryptographic integrity verification. Accepted formats:{' '}
          <span className="text-[var(--color-neon)]" style={{ fontFamily: 'var(--font-mono)' }}>
            .jpg .png .mp4
          </span>
        </p>
      </div>

      {/* ── Dropzone ────────────────────────────────── */}
      <div
        {...getRootProps()}
        id="file-dropzone"
        className={`
          relative group cursor-pointer rounded-xl p-8
          border-2 border-dashed transition-all duration-300 ease-out
          ${isDragReject
            ? 'border-[var(--color-threat)] bg-[var(--color-threat-dim)]'
            : isDragActive
              ? 'border-[var(--color-neon)] bg-[var(--color-neon-subtle)] neon-border'
              : 'border-[var(--color-steel)] bg-[var(--color-carbon)] hover:border-[var(--color-neon-dim)] hover:bg-[var(--color-graphite)]'
          }
        `}
      >
        <input {...getInputProps()} id="file-input" />

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[var(--color-neon-dim)] rounded-tl-lg opacity-40 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[var(--color-neon-dim)] rounded-tr-lg opacity-40 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[var(--color-neon-dim)] rounded-bl-lg opacity-40 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[var(--color-neon-dim)] rounded-br-lg opacity-40 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="flex flex-col items-center gap-4 py-6">
          {/* Icon */}
          <div className={`
            w-16 h-16 rounded-2xl flex items-center justify-center
            transition-all duration-300
            ${isDragActive
              ? 'bg-[var(--color-neon-subtle)] scale-110'
              : 'bg-[var(--color-graphite)] group-hover:bg-[var(--color-neon-subtle)] group-hover:scale-105'
            }
          `}>
            <Upload className={`
              w-7 h-7 transition-colors duration-300
              ${isDragActive
                ? 'text-[var(--color-neon-bright)]'
                : 'text-[var(--color-slate-dim)] group-hover:text-[var(--color-neon)]'
              }
            `} />
          </div>

          {/* Text */}
          {isDragReject ? (
            <>
              <p className="text-sm font-medium text-[var(--color-threat)]" style={{ fontFamily: 'var(--font-mono)' }}>
                ⚠ INVALID FILE FORMAT
              </p>
              <p className="text-xs text-[var(--color-slate-mid)]">
                Only .jpg, .png, and .mp4 files are permitted
              </p>
            </>
          ) : isDragActive ? (
            <>
              <p className="text-sm font-medium text-[var(--color-neon-bright)]" style={{ fontFamily: 'var(--font-mono)' }}>
                ▶ RELEASE TO INGEST
              </p>
              <p className="text-xs text-[var(--color-neon)]">
                Evidence will be scanned for C2PA manifests and verified
              </p>
            </>
          ) : (
            <>
              <div className="text-center">
                <p className="text-sm font-medium text-[var(--color-slate-bright)]">
                  Drag &amp; drop evidence files here
                </p>
                <p className="mt-1 text-xs text-[var(--color-slate-dim)]">
                  or{' '}
                  <span className="text-[var(--color-neon)] underline underline-offset-2 decoration-[var(--color-neon-dim)]">
                    browse your filesystem
                  </span>
                </p>
                
                <div className="mt-4">
                  <button
                    type="button"
                    disabled={isIngestingSample}
                    onClick={(e) => {
                      e.stopPropagation();
                      ingestSample();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--color-graphite)] border border-[var(--color-steel)] text-white text-[10px] font-bold tracking-wider hover:border-[var(--color-neon-dim)] hover:bg-[var(--color-steel)] transition-all cursor-pointer animate-pulse-neon"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {isIngestingSample ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-[var(--color-neon)]" />
                        INGESTING...
                      </>
                    ) : (
                      '▶ INGEST SAMPLE EVIDENCE'
                    )}
                  </button>
                </div>
              </div>

              {/* File type badges */}
              <div className="flex items-center gap-2 mt-1.5 justify-center">
                {['.JPG', '.PNG', '.MP4'].map((ext) => (
                  <span
                    key={ext}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--color-graphite)] text-[var(--color-slate-dim)] border border-[var(--color-gunmetal)]"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {ext}
                  </span>
                ))}
                <span className="text-[10px] text-[var(--color-ash)]">
                  max 500MB
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Queued Files ────────────────────────────── */}
      {files.length > 0 && (
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-[11px] font-semibold tracking-[0.15em] text-[var(--color-slate-mid)] uppercase"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Ingestion Queue
            </h2>
            <span
              className="text-[10px] text-[var(--color-slate-dim)]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {files.filter((f) => f.status === 'verified').length}/{files.length} verified
            </span>
          </div>

          {files.map((fileEntry, index) => (
            <FileCard
              key={fileEntry.id}
              fileEntry={fileEntry}
              index={index}
              onRemove={removeFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FileCard({ fileEntry, index, onRemove }) {
  const Icon = getFileIcon(fileEntry.type);
  const isError = fileEntry.status === 'error';
  const isVerified = fileEntry.status === 'verified';
  const isProcessing = fileEntry.status === 'reading' || fileEntry.status === 'validating';
  const isNoMetadata = fileEntry.status === 'no-metadata';
  const isInvalid = fileEntry.status === 'invalid';

  return (
    <div
      className="animate-fade-in-up glass-panel rounded-lg p-3 hover:border-[var(--color-ash)] transition-all duration-200"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start gap-3">
        {/* File icon */}
        <div className={`
          w-9 h-9 rounded-lg flex items-center justify-center shrink-0
          ${isError || isInvalid
            ? 'bg-[var(--color-threat-dim)]'
            : isVerified
              ? 'bg-[var(--color-verified-dim)]'
              : isNoMetadata
                ? 'bg-[var(--color-graphite)]'
                : 'bg-[var(--color-graphite)]'
          }
        `}>
          <Icon className={`w-4 h-4 ${
            isError || isInvalid ? 'text-[var(--color-threat)]'
            : isVerified ? 'text-[var(--color-neon)]'
            : 'text-[var(--color-slate-dim)]'
          }`} />
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-white truncate" style={{ fontFamily: 'var(--font-mono)' }}>
              {fileEntry.name}
            </span>
            <StatusBadge status={fileEntry.status} />
          </div>

          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] text-[var(--color-slate-dim)]" style={{ fontFamily: 'var(--font-mono)' }}>
              {formatFileSize(fileEntry.size)}
            </span>

            {fileEntry.hash && (
              <div className="flex items-center gap-1">
                <Hash className="w-2.5 h-2.5 text-[var(--color-ash)]" />
                <span className="text-[10px] text-[var(--color-ash)] truncate max-w-[180px]" style={{ fontFamily: 'var(--font-mono)' }}>
                  {fileEntry.hash.substring(0, 16)}…
                </span>
              </div>
            )}

            <div className="flex items-center gap-1">
              <Clock className="w-2.5 h-2.5 text-[var(--color-ash)]" />
              <span className="text-[10px] text-[var(--color-ash)]" style={{ fontFamily: 'var(--font-mono)' }}>
                {new Date(fileEntry.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* C2PA status message */}
          {fileEntry.c2paMessage && (
            <p className={`mt-1.5 text-[10px] ${
              isVerified ? 'text-[var(--color-neon-dim)]'
              : isInvalid ? 'text-[var(--color-threat)]'
              : isNoMetadata ? 'text-[var(--color-slate-dim)]'
              : 'text-[var(--color-caution)]'
            }`} style={{ fontFamily: 'var(--font-mono)' }}>
              {fileEntry.c2paMessage}
            </p>
          )}

          {/* Processing bar */}
          {isProcessing && (
            <div className="mt-2 h-0.5 rounded-full bg-[var(--color-graphite)] overflow-hidden">
              <div className="h-full bg-[var(--color-neon)] rounded-full animate-border-trace w-2/3" />
            </div>
          )}

          {/* Error message */}
          {isError && fileEntry.error && (
            <p className="mt-1 text-[10px] text-[var(--color-threat)]" style={{ fontFamily: 'var(--font-mono)' }}>
              ERR: {fileEntry.error}
            </p>
          )}
        </div>

        {/* Remove button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(fileEntry.id);
          }}
          className="p-1 rounded text-[var(--color-ash)] hover:text-[var(--color-threat)] hover:bg-[var(--color-threat-dim)] transition-all duration-200"
          aria-label={`Remove ${fileEntry.name}`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    queued: { label: 'QUEUED', color: 'text-[var(--color-slate-dim)]', bg: 'bg-[var(--color-graphite)]', border: 'border-[var(--color-gunmetal)]' },
    reading: { label: 'EXTRACTING', color: 'text-[var(--color-caution)]', bg: 'bg-[var(--color-caution-dim)]', border: 'border-[var(--color-caution)]/30' },
    validating: { label: 'VERIFYING', color: 'text-[var(--color-caution)]', bg: 'bg-[var(--color-caution-dim)]', border: 'border-[var(--color-caution)]/30' },
    verified: { label: 'VERIFIED', color: 'text-[var(--color-neon)]', bg: 'bg-[var(--color-verified-dim)]', border: 'border-[var(--color-neon-dim)]' },
    invalid: { label: 'SIG INVALID', color: 'text-[var(--color-threat)]', bg: 'bg-[var(--color-threat-dim)]', border: 'border-[var(--color-threat)]/30' },
    'no-metadata': { label: 'NO C2PA', color: 'text-[var(--color-slate-dim)]', bg: 'bg-[var(--color-graphite)]', border: 'border-[var(--color-gunmetal)]' },
    error: { label: 'REJECTED', color: 'text-[var(--color-threat)]', bg: 'bg-[var(--color-threat-dim)]', border: 'border-[var(--color-threat)]/30' },
  };

  const c = config[status] || config.queued;

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider border ${c.color} ${c.bg} ${c.border}`}
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      {status === 'verified' && <CheckCircle2 className="w-2.5 h-2.5" />}
      {status === 'invalid' && <AlertTriangle className="w-2.5 h-2.5" />}
      {status === 'error' && <AlertTriangle className="w-2.5 h-2.5" />}
      {status === 'no-metadata' && <ShieldOff className="w-2.5 h-2.5" />}
      {(status === 'reading' || status === 'validating') && (
        <Loader2 className="w-2.5 h-2.5 animate-spin" />
      )}
      {c.label}
    </span>
  );
}
