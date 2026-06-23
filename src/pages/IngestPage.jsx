import FileDropzone from '../components/FileDropzone';
import { Activity, FileCheck2, ShieldAlert, Clock } from 'lucide-react';
import { useValidation } from '../context/ValidationContext';

export default function IngestPage() {
  const { addValidation, stats: liveStats } = useValidation();

  // Compute live integrity score (percentage of files that are NOT tampered/invalid)
  const integrityScore = liveStats.total > 0
    ? `${Math.round(((liveStats.total - liveStats.invalid) / liveStats.total) * 100)}%`
    : '100%';

  const stats = [
    { label: 'Files Analyzed', value: String(liveStats.total), icon: FileCheck2, accent: false },
    { label: 'Threats Found', value: String(liveStats.invalid), icon: ShieldAlert, accent: liveStats.invalid > 0, isThreat: liveStats.invalid > 0 },
    { label: 'Analysis Engine', value: liveStats.total > 0 ? 'WASM+Node' : '—', icon: Clock, accent: false },
    { label: 'Integrity Score', value: integrityScore, icon: Activity, accent: true },
  ];

  return (
    <div className="animate-fade-in-up">
      {/* ── Stats Row ────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="glass-panel rounded-lg p-4 hover:border-[var(--color-ash)] transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`w-4 h-4 ${stat.isThreat ? 'text-[var(--color-threat)]' : stat.accent ? 'text-[var(--color-neon)]' : 'text-[var(--color-slate-dim)]'}`} />
              <span
                className={`text-lg font-bold ${stat.isThreat ? 'text-[var(--color-threat)]' : stat.accent ? 'neon-text' : 'text-white'}`}
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {stat.value}
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-wider text-[var(--color-slate-dim)]" style={{ fontFamily: 'var(--font-mono)' }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── File Dropzone ────────────────────────────── */}
      <FileDropzone onValidationComplete={addValidation} />

      {/* ── Footer Info ──────────────────────────────── */}
      <div className="mt-8 text-center">
        <p className="text-[10px] text-[var(--color-ash)]" style={{ fontFamily: 'var(--font-mono)' }}>
          All evidence is processed locally. Files are hashed with SHA-256 before analysis.
          <br />
          Chain of custody is maintained through immutable audit logging.
        </p>
      </div>
    </div>
  );
}

