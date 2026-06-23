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
} from 'lucide-react';

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

function generateMockHash() {
  const chars = '0123456789abcdef';
  let hash = '';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

function getFileIcon(type) {
  if (type.startsWith('image/')) return FileImage;
  if (type.startsWith('video/')) return FileVideo;
  return FileImage;
}

export default function FileDropzone() {
  const [files, setFiles] = useState([]);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    const newFiles = acceptedFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      hash: generateMockHash(),
      status: 'queued', // queued | processing | verified | error
      timestamp: new Date().toISOString(),
    }));

    // Simulate processing after a delay
    newFiles.forEach((fileEntry) => {
      setTimeout(() => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileEntry.id ? { ...f, status: 'processing' } : f
          )
        );
      }, 500);

      setTimeout(() => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileEntry.id ? { ...f, status: 'verified' } : f
          )
        );
      }, 2000 + Math.random() * 1500);
    });

    if (rejectedFiles.length > 0) {
      const rejected = rejectedFiles.map((r) => ({
        id: crypto.randomUUID(),
        file: r.file,
        name: r.file.name,
        size: r.file.size,
        type: r.file.type,
        hash: '—',
        status: 'error',
        timestamp: new Date().toISOString(),
        error: r.errors[0]?.message || 'Invalid file',
      }));
      setFiles((prev) => [...prev, ...rejected]);
    }

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

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
                Evidence will be hashed and queued for analysis
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
              </div>

              {/* File type badges */}
              <div className="flex items-center gap-2 mt-1">
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
  const isProcessing = fileEntry.status === 'processing';

  return (
    <div
      className="animate-fade-in-up glass-panel rounded-lg p-3 hover:border-[var(--color-ash)] transition-all duration-200"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start gap-3">
        {/* File icon */}
        <div className={`
          w-9 h-9 rounded-lg flex items-center justify-center shrink-0
          ${isError
            ? 'bg-[var(--color-threat-dim)]'
            : isVerified
              ? 'bg-[var(--color-verified-dim)]'
              : 'bg-[var(--color-graphite)]'
          }
        `}>
          <Icon className={`w-4 h-4 ${isError ? 'text-[var(--color-threat)]' : isVerified ? 'text-[var(--color-neon)]' : 'text-[var(--color-slate-dim)]'}`} />
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

            {fileEntry.hash !== '—' && (
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
    processing: { label: 'HASHING', color: 'text-[var(--color-caution)]', bg: 'bg-[var(--color-caution-dim)]', border: 'border-[var(--color-caution)]/30', icon: null },
    verified: { label: 'VERIFIED', color: 'text-[var(--color-neon)]', bg: 'bg-[var(--color-verified-dim)]', border: 'border-[var(--color-neon-dim)]' },
    error: { label: 'REJECTED', color: 'text-[var(--color-threat)]', bg: 'bg-[var(--color-threat-dim)]', border: 'border-[var(--color-threat)]/30' },
  };

  const c = config[status] || config.queued;

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider border ${c.color} ${c.bg} ${c.border}`}
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      {status === 'verified' && <CheckCircle2 className="w-2.5 h-2.5" />}
      {status === 'error' && <AlertTriangle className="w-2.5 h-2.5" />}
      {status === 'processing' && <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-caution)] animate-pulse-neon" />}
      {c.label}
    </span>
  );
}
