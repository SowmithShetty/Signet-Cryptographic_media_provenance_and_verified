import { useState, useEffect } from 'react';
import { useValidation } from '../context/ValidationContext';
import { Search, Eye, FileJson, Camera, ShieldAlert, Cpu } from 'lucide-react';

export default function AnalysisPage() {
  const { allProvenanceChains, validations } = useValidation();
  const [selectedId, setSelectedId] = useState('');

  // Auto-select first C2PA validation when it loads
  useEffect(() => {
    const withC2pa = validations.filter(v => v.hasManifest);
    if (withC2pa.length > 0 && !selectedId) {
      setSelectedId(withC2pa[0]._id);
    }
  }, [validations, selectedId]);

  // Find active record
  const activeRecord = validations.find(v => v._id === selectedId);

  const withC2pa = validations.filter(v => v.hasManifest);

  return (
    <div className="animate-fade-in-up">
      {/* ── Section Header ──────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Search className="w-4 h-4 text-[var(--color-neon)]" />
            <h1
              className="text-base font-semibold tracking-wider text-white uppercase"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Forensic Metadata Inspector
            </h1>
          </div>
          <p className="text-xs text-[var(--color-slate-mid)] leading-relaxed">
            Deconstruct and inspect embedded manifest assertions, digital signatures, and certificate chains.
          </p>
        </div>

        {/* Dropdown file selector */}
        {withC2pa.length > 0 && (
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="bg-[var(--color-carbon)] border border-[var(--color-steel)] text-white text-xs rounded px-3 py-1.5 focus:outline-none focus:border-[var(--color-neon)] font-mono max-w-xs shrink-0"
          >
            {withC2pa.map((v) => (
              <option key={v._id} value={v._id}>
                {v.fileName}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* ── Main View Split ─────────────────────────── */}
      {!activeRecord ? (
        <div className="glass-panel rounded-xl p-10 flex flex-col items-center justify-center text-center border border-[var(--color-gunmetal)] bg-[var(--color-carbon)]">
          <FileJson className="w-10 h-10 text-[var(--color-slate-dim)] mb-3 opacity-40 animate-pulse" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1 font-mono">No Metadata Records</h3>
          <p className="text-xs text-[var(--color-slate-dim)] max-w-sm">
            Please ingest a C2PA-signed media file (or load a sample evidence record) to access manifest inspection controls.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left panel: Info summary */}
          <div className="lg:col-span-5 space-y-4">
            {/* Assertion Summary Card */}
            <div className="glass-panel rounded-xl p-4 border border-[var(--color-gunmetal)] bg-[var(--color-carbon)]">
              <div className="flex items-center gap-2 mb-3 border-b border-[var(--color-gunmetal)] pb-2">
                <Cpu className="w-4 h-4 text-[var(--color-neon)]" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Manifest Overview</h4>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--color-ash)] uppercase tracking-wider font-mono">Claim Generator</span>
                  <span className="text-white font-mono">{activeRecord.claimGenerator || 'Unknown'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--color-ash)] uppercase tracking-wider font-mono">Manifest Count</span>
                  <span className="text-white font-mono">{activeRecord.manifestCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--color-ash)] uppercase tracking-wider font-mono">Signature Validity</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    activeRecord.signatureValid 
                      ? 'bg-[var(--color-verified-dim)] text-[var(--color-neon)]'
                      : 'bg-[var(--color-threat-dim)] text-[var(--color-threat)]'
                  }`}>
                    {activeRecord.signatureValid ? 'CRYPTOGRAPHICALLY VALID' : 'TAMPERED / BROKEN'}
                  </span>
                </div>
              </div>
            </div>

            {/* Camera / Hardware Assertions */}
            <div className="glass-panel rounded-xl p-4 border border-[var(--color-gunmetal)] bg-[var(--color-carbon)]">
              <div className="flex items-center gap-2 mb-3 border-b border-[var(--color-gunmetal)] pb-2">
                <Camera className="w-4 h-4 text-[var(--color-neon)]" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Hardware Assertions</h4>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--color-ash)] uppercase tracking-wider font-mono">Device Manufacturer</span>
                  <span className="text-white font-mono">
                    {activeRecord.claimGenerator.includes('Canon') ? 'Canon Inc.' 
                     : activeRecord.claimGenerator.includes('Sony') ? 'Sony Corporation' 
                     : activeRecord.claimGenerator.includes('Hikvision') ? 'Hikvision Technology'
                     : activeRecord.claimGenerator.includes('Axon') ? 'Axon Enterprise'
                     : 'Virtual Generator'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--color-ash)] uppercase tracking-wider font-mono">Hardware Model</span>
                  <span className="text-white font-mono">
                    {activeRecord.claimGenerator.split('/')?.[0]?.replace(/_/g, ' ') || 'Unknown Camera'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--color-ash)] uppercase tracking-wider font-mono">Secure Anchor Type</span>
                  <span className="text-white font-mono">Hardware-Attested Certificate</span>
                </div>
              </div>
            </div>

            {/* Invalidation logs if tampered */}
            {!activeRecord.signatureValid && activeRecord.validationStatus?.length > 0 && (
              <div className="glass-panel rounded-xl p-4 border border-[var(--color-threat)]/30 bg-[var(--color-threat-dim)] text-[var(--color-threat)]">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider font-mono">Tamper Log Detected</h4>
                </div>
                <ul className="list-disc pl-4 text-xs space-y-1">
                  {activeRecord.validationStatus.map((status, i) => (
                    <li key={i} className="font-mono text-[10px] leading-relaxed">
                      [{status.code || 'VALIDATION_ERR'}] {status.explanation || 'Signature check failed on binding block.'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right panel: Live manifest JSON explorer */}
          <div className="lg:col-span-7">
            <div className="glass-panel rounded-xl border border-[var(--color-gunmetal)] bg-[var(--color-carbon)] overflow-hidden h-[420px] flex flex-col">
              {/* Header tab */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--color-obsidian)] border-b border-[var(--color-gunmetal)] shrink-0 font-mono text-[10px]">
                <div className="flex items-center gap-2 text-white">
                  <Eye className="w-3.5 h-3.5 text-[var(--color-neon)]" />
                  <span>MANIFEST ASSERTIONS JSON</span>
                </div>
                <span className="text-[9px] text-[var(--color-slate-dim)] uppercase">C2PA Standard JUMBF Block</span>
              </div>

              {/* Code viewer */}
              <pre className="flex-1 p-4 overflow-y-auto text-[10px] text-[var(--color-slate-bright)] font-mono leading-relaxed bg-[var(--color-obsidian)] text-left select-all">
                {JSON.stringify(activeRecord, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
