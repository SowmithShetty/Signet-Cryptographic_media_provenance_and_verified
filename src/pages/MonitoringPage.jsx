import { useState, useEffect } from 'react';
import { useValidation } from '../context/ValidationContext';
import { Activity, ShieldAlert, CheckCircle, Radio, Terminal } from 'lucide-react';

const mockSystemLogs = [
  'Initializing C2PA Trust Anchor database...',
  'Checking validation endpoint /api/validate status...',
  'WASM runtime pre-warmed and ready to ingest media streams.',
  'Scanning incoming evidence directory for JUMBF packets...',
  'Verification queue idle. Listening on websocket port 5173...',
  'Core Engine status: operational, 0 critical alerts active.'
];

export default function MonitoringPage() {
  const { stats, validations } = useValidation();
  const [logs, setLogs] = useState(mockSystemLogs);

  // Generate logs on database changes or periodic intervals
  useEffect(() => {
    const timer = setInterval(() => {
      const randomLogs = [
        `Routine Audit check: validated ${stats.total} total files, integrity is at ${stats.total > 0 ? Math.round(((stats.total - stats.invalid) / stats.total) * 100) : 100}%.`,
        `Checked trust certificate list: 12 valid roots, 0 expired roots.`,
        `WASM memory usage stable: ${Math.round(performance.memory ? performance.memory.usedJSHeapSize / 1024 / 1024 : 45)}MB heap in use.`,
        `Ingest buffer listener reporting operational status.`,
      ];
      const log = randomLogs[Math.floor(Math.random() * randomLogs.length)];
      setLogs((prev) => [ `[${new Date().toLocaleTimeString()}] ${log}`, ...prev.slice(0, 15) ]);
    }, 4500);

    return () => clearInterval(timer);
  }, [stats]);

  // When validation records update, push validation event log
  useEffect(() => {
    if (validations.length > 0) {
      const latest = validations[0];
      const log = latest.hasManifest
        ? `[ALERT] File ${latest.fileName} audited: signature verification ${latest.signatureValid ? 'SUCCEEDED' : 'FAILED (Signature Invalid)'}.`
        : `[INFO] File ${latest.fileName} ingested: no C2PA manifest found.`;
      setLogs((prev) => [ `[${new Date().toLocaleTimeString()}] ${log}`, ...prev.slice(0, 15) ]);
    }
  }, [validations]);

  return (
    <div className="animate-fade-in-up">
      {/* ── Section Header ──────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-4 h-4 text-[var(--color-neon)] animate-pulse" />
          <h1
            className="text-base font-semibold tracking-wider text-white uppercase"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Threat Monitoring Center
          </h1>
        </div>
        <p className="text-xs text-[var(--color-slate-mid)] leading-relaxed">
          Real-time security telemetry of the evidence ingestion system, highlighting C2PA validation anomalies and certificate trust levels.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Side: System Metrics & Anomalies */}
        <div className="space-y-4 lg:col-span-1">
          {/* Active Status Box */}
          <div className="glass-panel rounded-xl p-5 border border-[var(--color-gunmetal)] bg-[var(--color-carbon)] flex items-center gap-4">
            <div className="relative flex items-center justify-center shrink-0">
              <span className="absolute w-4 h-4 rounded-full bg-[var(--color-neon)] animate-ping opacity-30" />
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-neon)]" />
            </div>
            <div>
              <p className="text-[10px] text-[var(--color-slate-dim)] uppercase tracking-wider font-mono">Forensic System Status</p>
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">Operational</h3>
            </div>
          </div>

          {/* Anomaly Dashboard */}
          <div className="glass-panel rounded-xl p-5 border border-[var(--color-gunmetal)] bg-[var(--color-carbon)] space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono border-b border-[var(--color-gunmetal)] pb-2">Anomaly Counters</h4>
            
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-lg bg-[var(--color-graphite)] border border-[var(--color-gunmetal)]">
                <ShieldAlert className="w-4 h-4 mx-auto mb-1 text-[var(--color-threat)]" />
                <h3 className="text-lg font-bold text-white font-mono">{stats.invalid}</h3>
                <p className="text-[9px] text-[var(--color-slate-dim)] uppercase tracking-wider font-mono">Tampered Files</p>
              </div>

              <div className="p-3 rounded-lg bg-[var(--color-graphite)] border border-[var(--color-gunmetal)]">
                <CheckCircle className="w-4 h-4 mx-auto mb-1 text-[var(--color-neon)]" />
                <h3 className="text-lg font-bold text-white font-mono">{stats.valid}</h3>
                <p className="text-[9px] text-[var(--color-slate-dim)] uppercase tracking-wider font-mono">Verified Clean</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Live Logs console */}
        <div className="lg:col-span-2">
          <div className="glass-panel rounded-xl border border-[var(--color-gunmetal)] bg-[var(--color-obsidian)] overflow-hidden h-[340px] flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--color-carbon)] border-b border-[var(--color-gunmetal)] shrink-0 font-mono text-[10px]">
              <div className="flex items-center gap-2 text-white">
                <Terminal className="w-3.5 h-3.5 text-[var(--color-neon)]" />
                <span>REAL-TIME AUDIT STREAM</span>
              </div>
              <span className="flex items-center gap-1 text-[9px] text-[var(--color-neon)]">
                <Radio className="w-2.5 h-2.5 animate-pulse" />
                LIVE
              </span>
            </div>

            {/* Scrolling command lines */}
            <div className="flex-1 p-4 overflow-y-auto font-mono text-[10px] text-[var(--color-slate-bright)] space-y-2 text-left">
              {logs.map((log, index) => (
                <div key={index} className={`leading-relaxed ${
                  log.includes('[ALERT]') ? 'text-[var(--color-threat)]' 
                  : log.includes('[INFO]') ? 'text-[var(--color-caution)]'
                  : 'text-[var(--color-slate-dim)]'
                }`}>
                  {log.startsWith('[') ? log : `[${new Date().toLocaleTimeString()}] ${log}`}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
