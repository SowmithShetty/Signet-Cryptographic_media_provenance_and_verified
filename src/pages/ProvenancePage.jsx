import { useState, useEffect } from 'react';
import ProvenanceTimeline from '../components/ProvenanceTimeline';
import { GitBranch, Shield, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useValidation } from '../context/ValidationContext';

export default function ProvenancePage() {
  const { allProvenanceChains } = useValidation();
  const [selectedChainId, setSelectedChainId] = useState('');

  // Auto-select the first available chain when chains load
  useEffect(() => {
    if (allProvenanceChains.length > 0 && !selectedChainId) {
      setSelectedChainId(allProvenanceChains[0].id);
    }
  }, [allProvenanceChains, selectedChainId]);

  // Find currently selected record
  const selectedRecord = allProvenanceChains.find((c) => c.id === selectedChainId);

  // If no live records, fall back to mock data
  const isDemo = !selectedRecord;

  // Stats calculation
  let chainLength = '3';
  let validSigs = '2';
  let anomalies = '1';

  if (selectedRecord) {
    chainLength = String(selectedRecord.chain.length);
    validSigs = String(selectedRecord.chain.filter((a) => a.signatureValid).length);
    anomalies = String(selectedRecord.chain.filter((a) => !a.signatureValid).length);
  }

  const stats = [
    { label: 'Chain Length', value: chainLength, icon: GitBranch, accent: false },
    { label: 'Valid Signatures', value: validSigs, icon: Shield, accent: true },
    {
      label: 'Anomalies Detected',
      value: anomalies,
      icon: AlertTriangle,
      accent: parseInt(anomalies) > 0,
      isThreat: parseInt(anomalies) > 0
    },
  ];

  return (
    <div className="animate-fade-in-up">
      {/* ── Heading and Record Selector ───────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-sm font-semibold tracking-wider text-[var(--color-slate-bright)] uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
            Provenance Investigator
          </h2>
          <p className="text-[11px] text-[var(--color-slate-dim)]">
            {isDemo
              ? "Viewing demo/simulated metadata. Ingest C2PA files to inspect active records."
              : `Analyzing chain of custody for evidence file: ${selectedRecord.fileName}`}
          </p>
        </div>

        {allProvenanceChains.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--color-ash)] uppercase tracking-wider font-mono">Evidence File:</span>
            <select
              value={selectedChainId}
              onChange={(e) => setSelectedChainId(e.target.value)}
              className="bg-[var(--color-carbon)] border border-[var(--color-steel)] text-white text-xs rounded px-3 py-1.5 focus:outline-none focus:border-[var(--color-neon)] font-mono"
            >
              {allProvenanceChains.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fileName} ({new Date(c.analyzedAt).toLocaleTimeString()})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Demo Warning Banner ─────────────────────── */}
      {isDemo && (
        <div className="mb-6 p-4 rounded-lg bg-[var(--color-caution-dim)] border border-[var(--color-caution)]/30 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-[var(--color-caution)] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-semibold text-[var(--color-caution)] uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-mono)' }}>
              Demo Mode Active
            </h4>
            <p className="text-[11px] text-[var(--color-slate-mid)] leading-relaxed">
              No live files with cryptographic provenance metadata have been ingested. The timeline below is rendering mock simulation data.
              To test live visualization, upload a media file containing a valid C2PA manifest (e.g. from Content Authenticity Initiative) on the Ingest page.
            </p>
          </div>
        </div>
      )}

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
      {isDemo ? (
        <ProvenanceTimeline />
      ) : (
        <ProvenanceTimeline key={selectedRecord.id} editActions={selectedRecord.chain} />
      )}

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

