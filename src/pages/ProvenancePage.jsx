import ProvenanceTimeline from '../components/ProvenanceTimeline';
import { GitBranch, Shield, AlertTriangle } from 'lucide-react';

const stats = [
  { label: 'Chain Length', value: '3', icon: GitBranch, accent: false },
  { label: 'Valid Signatures', value: '2', icon: Shield, accent: true },
  { label: 'Anomalies Detected', value: '1', icon: AlertTriangle, accent: false, isThreat: true },
];

export default function ProvenancePage() {
  return (
    <div className="animate-fade-in-up">
      {/* ── Stats Row ────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="glass-panel rounded-lg p-4 hover:border-[var(--color-ash)] transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon
                className={`w-4 h-4 ${
                  stat.isThreat
                    ? 'text-[var(--color-threat)]'
                    : stat.accent
                      ? 'text-[var(--color-neon)]'
                      : 'text-[var(--color-slate-dim)]'
                }`}
              />
              <span
                className={`text-lg font-bold ${
                  stat.isThreat
                    ? 'text-[var(--color-threat)]'
                    : stat.accent
                      ? 'neon-text'
                      : 'text-white'
                }`}
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {stat.value}
              </span>
            </div>
            <p
              className="text-[10px] uppercase tracking-wider text-[var(--color-slate-dim)]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Provenance Timeline (DAG) ────────────────── */}
      <ProvenanceTimeline />

      {/* ── Footer ───────────────────────────────────── */}
      <div className="mt-6 text-center">
        <p
          className="text-[10px] text-[var(--color-ash)]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Provenance data extracted from C2PA manifest. Drag nodes to rearrange.
          <br />
          Red edges indicate broken chain of trust. Investigate flagged actions.
        </p>
      </div>
    </div>
  );
}
