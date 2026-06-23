import { Bell, Search, Cpu, Wifi } from 'lucide-react';

export default function Header() {
  return (
    <header
      id="main-header"
      className="fixed top-0 right-0 z-30 flex items-center justify-between px-6 border-b border-[var(--color-gunmetal)] bg-[var(--color-obsidian)]/80 backdrop-blur-md"
      style={{
        left: 'var(--sidebar-width)',
        height: 'var(--header-height)',
      }}
    >
      {/* Left — Breadcrumb / Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-[var(--color-slate-mid)]">
          <span className="text-[11px] tracking-wider uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
            SIGNET
          </span>
          <span className="text-[var(--color-ash)]">/</span>
          <span className="text-[11px] tracking-wider uppercase text-white" style={{ fontFamily: 'var(--font-mono)' }}>
            Evidence Ingest
          </span>
        </div>
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-2">
        {/* Live throughput indicator */}
        <div className="hidden md:flex items-center gap-2 mr-3 px-3 py-1 rounded-md bg-[var(--color-graphite)] border border-[var(--color-gunmetal)]">
          <Cpu className="w-3 h-3 text-[var(--color-neon)] animate-pulse-neon" />
          <span className="text-[10px] text-[var(--color-slate-mid)]" style={{ fontFamily: 'var(--font-mono)' }}>
            CPU 12%
          </span>
          <span className="mx-1 w-px h-3 bg-[var(--color-gunmetal)]" />
          <Wifi className="w-3 h-3 text-[var(--color-neon)]" />
          <span className="text-[10px] text-[var(--color-slate-mid)]" style={{ fontFamily: 'var(--font-mono)' }}>
            SECURE
          </span>
        </div>

        {/* Search */}
        <button
          id="header-search-btn"
          className="p-2 rounded-lg text-[var(--color-slate-dim)] hover:text-white hover:bg-[var(--color-graphite)] transition-all duration-200"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <button
          id="header-notifications-btn"
          className="relative p-2 rounded-lg text-[var(--color-slate-dim)] hover:text-white hover:bg-[var(--color-graphite)] transition-all duration-200"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--color-neon)] shadow-[0_0_6px_var(--color-neon-glow)]" />
        </button>

        {/* Session timer */}
        <div className="ml-2 pl-3 border-l border-[var(--color-gunmetal)]">
          <span className="text-[10px] text-[var(--color-slate-dim)]" style={{ fontFamily: 'var(--font-mono)' }}>
            SESSION
          </span>
          <SessionTimer />
        </div>
      </div>
    </header>
  );
}

function SessionTimer() {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[11px] text-[var(--color-neon)] tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>
        00:00:00
      </span>
      <span className="w-1 h-3 bg-[var(--color-neon)] animate-terminal-blink" />
    </div>
  );
}
