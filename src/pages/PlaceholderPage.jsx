import { Construction } from 'lucide-react';

export default function PlaceholderPage({ title }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in-up">
      <div className="w-16 h-16 rounded-2xl bg-[var(--color-graphite)] border border-[var(--color-gunmetal)] flex items-center justify-center mb-4">
        <Construction className="w-7 h-7 text-[var(--color-slate-dim)]" />
      </div>
      <h1
        className="text-sm font-semibold tracking-[0.2em] text-[var(--color-slate-bright)] uppercase mb-2"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {title}
      </h1>
      <p className="text-xs text-[var(--color-slate-dim)] text-center max-w-md">
        This module is under development. Connect backend services to activate forensic analysis capabilities.
      </p>
      <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-graphite)] border border-[var(--color-gunmetal)]">
        <span className="w-2 h-2 rounded-full bg-[var(--color-caution)] animate-pulse-neon" />
        <span className="text-[10px] tracking-wider text-[var(--color-caution)]" style={{ fontFamily: 'var(--font-mono)' }}>
          MODULE PENDING INTEGRATION
        </span>
      </div>
    </div>
  );
}
