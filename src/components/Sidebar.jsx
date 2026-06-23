import { NavLink, useLocation } from 'react-router-dom';
import {
  Shield,
  Upload,
  GitBranch,
  FileSearch,
  Activity,
  History,
  Settings,
  Terminal,
  Lock,
  ChevronRight,
} from 'lucide-react';

const navSections = [
  {
    label: 'OPERATIONS',
    items: [
      { to: '/', icon: Upload, label: 'Ingest', badge: null },
      { to: '/provenance', icon: GitBranch, label: 'Provenance', badge: null },
      { to: '/analysis', icon: FileSearch, label: 'Analysis', badge: null },
      { to: '/monitoring', icon: Activity, label: 'Monitoring', badge: '3' },
    ],
  },
  {
    label: 'FORENSICS',
    items: [
      { to: '/audit-log', icon: History, label: 'Audit Log', badge: null },
      { to: '/terminal', icon: Terminal, label: 'Terminal', badge: null },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { to: '/settings', icon: Settings, label: 'Settings', badge: null },
    ],
  },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside
      id="sidebar-nav"
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col"
      style={{ width: 'var(--sidebar-width)' }}
    >
      {/* Background with subtle gradient */}
      <div className="absolute inset-0 bg-[var(--color-obsidian)] border-r border-[var(--color-gunmetal)]" />

      {/* Scanline overlay for aesthetic */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none overflow-hidden">
        <div
          className="w-full h-[2px] bg-[var(--color-neon)] animate-scan-line"
          style={{ position: 'absolute', top: 0 }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* ── Brand Header ──────────────────────────────── */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-gunmetal)]">
          <div className="relative">
            <div className="w-9 h-9 rounded-lg bg-[var(--color-neon-subtle)] border border-[var(--color-neon-dim)] flex items-center justify-center">
              <Shield className="w-5 h-5 text-[var(--color-neon)]" />
            </div>
            {/* Pulse ring */}
            <div className="absolute -inset-0.5 rounded-lg border border-[var(--color-neon)] opacity-20 animate-pulse-neon" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-[0.2em] text-white" style={{ fontFamily: 'var(--font-mono)' }}>
              SIGNET
            </span>
            <span className="text-[10px] tracking-[0.15em] text-[var(--color-slate-mid)] uppercase">
              Forensic Platform
            </span>
          </div>
        </div>

        {/* ── System Status Badge ───────────────────────── */}
        <div className="px-5 py-3 border-b border-[var(--color-gunmetal)]">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--color-verified-dim)]">
            <div className="neon-dot animate-pulse-neon" />
            <span className="text-[10px] font-medium tracking-widest uppercase text-[var(--color-neon)]" style={{ fontFamily: 'var(--font-mono)' }}>
              System Operational
            </span>
          </div>
        </div>

        {/* ── Navigation ────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navSections.map((section) => (
            <div key={section.label} className="mb-5">
              <h3
                className="px-3 mb-2 text-[10px] font-semibold tracking-[0.2em] text-[var(--color-slate-mid)]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {section.label}
              </h3>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.to;
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                        className={`
                          group flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                          transition-all duration-200 ease-out relative overflow-hidden
                          ${isActive
                            ? 'bg-[var(--color-neon-subtle)] text-[var(--color-neon-bright)]'
                            : 'text-[var(--color-slate-bright)] hover:bg-[var(--color-graphite)] hover:text-white'
                          }
                        `}
                      >
                        {/* Active indicator bar */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--color-neon)] shadow-[0_0_8px_var(--color-neon-glow)]" />
                        )}

                        <item.icon className={`w-4 h-4 shrink-0 transition-colors duration-200 ${isActive ? 'text-[var(--color-neon)]' : 'text-[var(--color-slate-dim)] group-hover:text-[var(--color-slate-bright)]'}`} />

                        <span className="flex-1 font-medium" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                          {item.label}
                        </span>

                        {item.badge && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[var(--color-neon-subtle)] text-[var(--color-neon)] border border-[var(--color-neon-dim)]" style={{ fontFamily: 'var(--font-mono)' }}>
                            {item.badge}
                          </span>
                        )}

                        <ChevronRight className={`w-3 h-3 transition-all duration-200 ${isActive ? 'opacity-100 text-[var(--color-neon)]' : 'opacity-0 group-hover:opacity-50'}`} />
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* ── Footer ────────────────────────────────────── */}
        <div className="px-4 py-3 border-t border-[var(--color-gunmetal)]">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[var(--color-graphite)] transition-colors duration-200 cursor-pointer">
            <div className="w-7 h-7 rounded-md bg-[var(--color-steel)] flex items-center justify-center">
              <Lock className="w-3.5 h-3.5 text-[var(--color-slate-mid)]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-[var(--color-slate-bright)]" style={{ fontFamily: 'var(--font-mono)' }}>
                Operator
              </span>
              <span className="text-[10px] text-[var(--color-slate-dim)]">
                Session Encrypted
              </span>
            </div>
          </div>
          <p className="mt-2 px-2 text-[9px] text-[var(--color-ash)]" style={{ fontFamily: 'var(--font-mono)' }}>
            v0.1.0 · SHA-256 VERIFIED
          </p>
        </div>
      </div>
    </aside>
  );
}
