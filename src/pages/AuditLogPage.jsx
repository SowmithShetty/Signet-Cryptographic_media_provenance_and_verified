import { useValidation } from '../context/ValidationContext';
import { ShieldCheck, ShieldAlert, ShieldOff, ClipboardList, RefreshCw, HardDrive } from 'lucide-react';

function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function AuditLogPage() {
  const { validations, loading } = useValidation();

  return (
    <div className="animate-fade-in-up">
      {/* ── Section Header ──────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList className="w-4 h-4 text-[var(--color-neon)]" />
            <h1
              className="text-base font-semibold tracking-wider text-white uppercase"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Forensic Audit Logs
            </h1>
          </div>
          <p className="text-xs text-[var(--color-slate-mid)] leading-relaxed">
            Cryptographic ledger tracking all ingested evidence items, verification statuses, and metadata assertions.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[var(--color-carbon)] border border-[var(--color-gunmetal)] text-[10px] text-[var(--color-slate-dim)] font-mono">
          <HardDrive className="w-3.5 h-3.5" />
          {validations.length} RECORD(S) SECURED
        </div>
      </div>

      {/* ── Table Layout ────────────────────────────── */}
      <div className="glass-panel rounded-xl overflow-hidden border border-[var(--color-gunmetal)] bg-[var(--color-obsidian)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--color-gunmetal)] bg-[var(--color-carbon)] text-[10px] tracking-wider text-[var(--color-slate-dim)] uppercase font-mono">
                <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                <th className="py-3.5 px-4 font-semibold">File Name</th>
                <th className="py-3.5 px-4 font-semibold">Size</th>
                <th className="py-3.5 px-4 font-semibold text-center">C2PA Manifest</th>
                <th className="py-3.5 px-4 font-semibold text-center">Signature Status</th>
                <th className="py-3.5 px-4 font-semibold font-mono">SHA-256 Hash / Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-gunmetal)] font-mono">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-[var(--color-slate-dim)]">
                      <RefreshCw className="w-5 h-5 animate-spin text-[var(--color-neon)]" />
                      Reading cryptographic ledger...
                    </div>
                  </td>
                </tr>
              ) : validations.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center">
                    <div className="text-[var(--color-slate-dim)] flex flex-col items-center gap-2">
                      <ClipboardList className="w-8 h-8 opacity-30" />
                      <span>Audit log ledger is empty. Upload files in Ingest page.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                validations.map((v) => {
                  const signatureStatus = !v.hasManifest 
                    ? 'n-a' 
                    : v.signatureValid 
                      ? 'verified' 
                      : 'tampered';

                  const hash = v.provenanceChain?.[0]?.hash || v._id;

                  return (
                    <tr key={v._id} className="hover:bg-[var(--color-carbon)] transition-colors text-[11px] text-[var(--color-slate-bright)]">
                      <td className="py-3 px-4 text-[var(--color-slate-dim)]">
                        {new Date(v.analyzedAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-semibold truncate max-w-[180px]">
                        {v.fileName}
                      </td>
                      <td className="py-3 px-4 text-[var(--color-slate-dim)]">
                        {formatBytes(v.fileSize)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold border ${
                          v.hasManifest
                            ? 'bg-[var(--color-verified-dim)] text-[var(--color-neon)] border-[var(--color-neon-dim)]'
                            : 'bg-[var(--color-graphite)] text-[var(--color-slate-dim)] border-[var(--color-gunmetal)]'
                        }`}>
                          {v.hasManifest ? 'EMBEDDED' : 'ABSENT'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center">
                          {signatureStatus === 'verified' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[var(--color-verified-dim)] text-[var(--color-neon)] border border-[var(--color-neon-dim)]">
                              <ShieldCheck className="w-3 h-3" />
                              VERIFIED
                            </span>
                          )}
                          {signatureStatus === 'tampered' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[var(--color-threat-dim)] text-[var(--color-threat)] border border-[var(--color-threat)]/30 animate-pulse-neon">
                              <ShieldAlert className="w-3 h-3" />
                              TAMPERED
                            </span>
                          )}
                          {signatureStatus === 'n-a' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[var(--color-graphite)] text-[var(--color-slate-dim)] border border-[var(--color-gunmetal)]">
                              <ShieldOff className="w-3 h-3" />
                              UNAVAILABLE
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[var(--color-ash)] truncate max-w-[200px]" title={hash}>
                        {hash}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
