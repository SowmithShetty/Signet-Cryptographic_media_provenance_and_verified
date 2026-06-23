import { useState, useRef, useEffect } from 'react';
import { useValidation } from '../context/ValidationContext';
import { validateSampleFile } from '../services/apiService';
import { Terminal, Shield } from 'lucide-react';

const INITIAL_WELCOME = [
  'SIGNET SECURE FORENSIC SHELL v0.2.0',
  'Type "help" for a list of available diagnostic commands.',
  ''
];

export default function TerminalPage() {
  const { validations, stats } = useValidation();
  const [history, setHistory] = useState(INITIAL_WELCOME);
  const [input, setInput] = useState('');
  const terminalEndRef = useRef(null);

  // Auto-scroll to bottom of console
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommandSubmit = async (e) => {
    e.preventDefault();
    const command = input.trim();
    if (!command) return;

    setHistory((prev) => [...prev, `guest@signet-term:~$ ${command}`]);
    setInput('');

    const lowerCmd = command.toLowerCase();
    const args = lowerCmd.split(' ');
    const cmdName = args[0];

    switch (cmdName) {
      case 'clear':
        setHistory([]);
        break;
      case 'help':
        setHistory((prev) => [
          ...prev,
          'Available Commands:',
          '  help         - Display command list',
          '  status       - Show system telemetry and service connections',
          '  validations  - Print table of all audited evidence files',
          '  verify       - Trigger a new mock evidence C2PA validation test',
          '  clear        - Clear console history',
        ]);
        break;
      case 'status':
        const isMongo = validations.length > 0 && !validations.some(v => String(v._id).startsWith('temp-'));
        setHistory((prev) => [
          ...prev,
          '--- SYSTEM TELEMETRY STATUS ---',
          `Forensic Engine:  C2PA WASM (Ready)`,
          `Signature Module: @contentauth/c2pa-node (Loaded)`,
          `Persistence:      ${isMongo ? 'MongoDB Connected' : 'In-Memory DB (Active)'}`,
          `Total Audited:    ${stats.total} record(s)`,
          `Integrity Score:  ${stats.total > 0 ? Math.round(((stats.total - stats.invalid) / stats.total) * 100) : 100}%`,
          '-------------------------------'
        ]);
        break;
      case 'validations':
        if (validations.length === 0) {
          setHistory((prev) => [...prev, 'No validations stored in ledger. Ingest evidence first.']);
        } else {
          setHistory((prev) => [
            ...prev,
            '┌──────────────────────────────┬────────────┬─────────────┬─────────────────┐',
            '│ FILE NAME                    │ SIZE       │ C2PA        │ STATUS          │',
            '├──────────────────────────────┼────────────┼─────────────┼─────────────────┤',
            ...validations.map(v => {
              const name = v.fileName.padEnd(28).substring(0, 28);
              const size = (Math.round(v.fileSize / 1024) + ' KB').padEnd(10).substring(0, 10);
              const c2pa = (v.hasManifest ? 'EMBEDDED' : 'ABSENT').padEnd(11);
              const status = (v.hasManifest ? (v.signatureValid ? 'VERIFIED' : 'TAMPERED') : 'CLEAN').padEnd(15);
              return `│ ${name} │ ${size} │ ${c2pa} │ ${status} │`;
            }),
            '└──────────────────────────────┴────────────┴─────────────┴─────────────────┘'
          ]);
        }
        break;
      case 'verify':
        setHistory((prev) => [...prev, 'Sending sample evidence verification request to backend server...']);
        try {
          const res = await validateSampleFile();
          setHistory((prev) => [
            ...prev,
            `✓ Successfully validated: ${res.fileName}`,
            `  Size:       ${Math.round(res.fileSize / 1024)} KB`,
            `  Signature:  ${res.signatureValid ? 'VALID (Verified)' : 'INVALID (ATTENTION - Anomaly Detected)'}`,
            `  Chain:      ${res.provenanceChain?.length || 0} node(s) mapped in history`
          ]);
        } catch (err) {
          setHistory((prev) => [...prev, `⚠ Error running validation: ${err.message}`]);
        }
        break;
      default:
        setHistory((prev) => [
          ...prev,
          `signet-shell: command not found: "${command}". Type "help" for support.`
        ]);
    }
  };

  return (
    <div className="animate-fade-in-up">
      {/* ── Section Header ──────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Terminal className="w-4 h-4 text-[var(--color-neon)]" />
          <h1
            className="text-base font-semibold tracking-wider text-white uppercase"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Secured Forensic Terminal
          </h1>
        </div>
        <p className="text-xs text-[var(--color-slate-mid)] leading-relaxed">
          Interactive CLI engine providing direct console access to C2PA verification parameters, audit ledgers, and engine runtimes.
        </p>
      </div>

      {/* ── Terminal Window ─────────────────────────── */}
      <div className="glass-panel rounded-xl border border-[var(--color-gunmetal)] bg-[var(--color-obsidian)] overflow-hidden flex flex-col h-[460px]">
        {/* Terminal Title Bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-carbon)] border-b border-[var(--color-gunmetal)] shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-threat)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-caution)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-neon)]" />
          </div>
          <span className="text-[10px] tracking-wider font-bold text-white uppercase font-mono ml-2">
            console.host: signet-forensic-terminal
          </span>
          <Shield className="w-3.5 h-3.5 text-[var(--color-neon-dim)] ml-auto" />
        </div>

        {/* Console output stream */}
        <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] text-[var(--color-slate-bright)] space-y-1.5 text-left bg-[var(--color-obsidian)]">
          {history.map((line, idx) => (
            <div key={idx} className="whitespace-pre-wrap leading-relaxed">
              {line}
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>

        {/* Command line input */}
        <form onSubmit={handleCommandSubmit} className="flex items-center px-4 py-3 bg-[var(--color-carbon)] border-t border-[var(--color-gunmetal)] shrink-0 font-mono text-xs">
          <span className="text-[var(--color-neon)] mr-2 shrink-0">guest@signet-term:~$</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent border-none text-white outline-none focus:ring-0 p-0 font-mono text-xs"
            placeholder="Type command..."
            autoFocus
          />
        </form>
      </div>
    </div>
  );
}
