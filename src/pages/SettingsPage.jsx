import { useValidation } from '../context/ValidationContext';
import { Shield, Database, Cpu, Settings, ToggleLeft, ToggleRight, Radio } from 'lucide-react';

export default function SettingsPage() {
  const { simulationMode, toggleSimulationMode, validations } = useValidation();

  // Find if Mongo is connected by checking validations id prefix
  const isMongoConnected = validations.length > 0 && !validations.some(v => String(v._id).startsWith('temp-'));

  const telemetry = [
    { label: 'Forensic Engine', value: 'C2PA WASM v0.12.0', status: 'operational', icon: Cpu },
    { label: 'Backend Signature Validator', value: '@contentauth/c2pa-node v0.6.0', status: 'operational', icon: Shield },
    {
      label: 'Persistence Layer',
      value: isMongoConnected ? 'MongoDB Server' : 'In-Memory DB Fallback (Active)',
      status: isMongoConnected ? 'operational' : 'warning',
      icon: Database
    },
  ];

  return (
    <div className="animate-fade-in-up max-w-3xl mx-auto">
      {/* ── Section Header ──────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-4 h-4 text-[var(--color-neon)]" />
          <h1
            className="text-base font-semibold tracking-wider text-white uppercase"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            System Settings &amp; Telemetry
          </h1>
        </div>
        <p className="text-xs text-[var(--color-slate-mid)] leading-relaxed">
          Configure forensic analysis parameters, cryptographic thresholds, and inspect backend service connection statuses.
        </p>
      </div>

      <div className="space-y-6">
        {/* ── Developer Simulation Mode ───────────────── */}
        <div className="glass-panel rounded-xl p-5 border border-[var(--color-gunmetal)] bg-[var(--color-carbon)] hover:border-[var(--color-ash)] transition-all">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xs font-bold tracking-wider text-white uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
                Developer Simulation Mode
              </h3>
              <p className="text-xs text-[var(--color-slate-dim)] leading-relaxed max-w-lg">
                When active, the backend will automatically generate realistic C2PA provenance manifests and metadata chains for **any** standard image or video uploaded. Use this to test the timeline DAG and statistics dashboards if you do not have C2PA-signed sample media.
              </p>
            </div>
            <button
              onClick={toggleSimulationMode}
              className="focus:outline-none shrink-0 transition-colors duration-200 cursor-pointer"
            >
              {simulationMode ? (
                <ToggleRight className="w-12 h-12 text-[var(--color-neon)]" />
              ) : (
                <ToggleLeft className="w-12 h-12 text-[var(--color-slate-dim)]" />
              )}
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-graphite)] border border-[var(--color-gunmetal)] w-fit">
            <span className={`w-2 h-2 rounded-full ${simulationMode ? 'bg-[var(--color-neon)] animate-pulse-neon' : 'bg-[var(--color-slate-dim)]'}`} />
            <span className="text-[10px] font-bold tracking-wider uppercase font-mono" style={{ color: simulationMode ? 'var(--color-neon)' : 'var(--color-slate-dim)' }}>
              {simulationMode ? 'SIMULATION MODE ACTIVE (FORCE C2PA ON ALL UPLOADS)' : 'SIMULATION MODE OFF'}
            </span>
          </div>
        </div>

        {/* ── Telemetry Stats ─────────────────────────── */}
        <div className="glass-panel rounded-xl p-5 border border-[var(--color-gunmetal)] bg-[var(--color-carbon)] space-y-4">
          <h3 className="text-xs font-bold tracking-wider text-white uppercase mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
            Service Telemetry
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {telemetry.map((t) => (
              <div
                key={t.label}
                className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-graphite)] border border-[var(--color-gunmetal)]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[var(--color-obsidian)] border border-[var(--color-gunmetal)] flex items-center justify-center">
                    <t.icon className="w-4 h-4 text-[var(--color-slate-dim)]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--color-slate-dim)] uppercase tracking-wider font-mono">{t.label}</p>
                    <p className="text-xs font-medium text-white">{t.value}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold tracking-wider border bg-[var(--color-obsidian)]"
                  style={{
                    color: t.status === 'operational' ? 'var(--color-neon)' : 'var(--color-caution)',
                    borderColor: t.status === 'operational' ? 'var(--color-neon-dim)' : 'var(--color-caution)/30',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  <Radio className="w-2.5 h-2.5 animate-pulse" />
                  {t.status.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Static configuration info ───────────────── */}
        <div className="glass-panel rounded-xl p-5 border border-[var(--color-gunmetal)] bg-[var(--color-carbon)]">
          <h3 className="text-xs font-bold tracking-wider text-white uppercase mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
            Analysis Preferences
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-[9px] text-[var(--color-ash)] uppercase tracking-wider font-mono">Hash Algorithm</label>
              <select className="w-full bg-[var(--color-graphite)] border border-[var(--color-steel)] text-white text-xs rounded p-2 focus:outline-none focus:border-[var(--color-neon)] font-mono" disabled>
                <option>SHA-256 (Enforced)</option>
                <option>SHA-512</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-[var(--color-ash)] uppercase tracking-wider font-mono">Validation Threshold</label>
              <select className="w-full bg-[var(--color-graphite)] border border-[var(--color-steel)] text-white text-xs rounded p-2 focus:outline-none focus:border-[var(--color-neon)] font-mono" disabled>
                <option>Strict Trust (Enforce C2PA Certificate Check)</option>
                <option>Permissive Check</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
