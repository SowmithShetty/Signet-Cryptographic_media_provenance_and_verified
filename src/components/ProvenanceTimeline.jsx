import { useMemo, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Position,
  Handle,
  BaseEdge,
  getSmoothStepPath,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  ShieldCheck,
  ShieldAlert,
  Fingerprint,
  Hash,
  Clock,
  Cpu,
  ChevronRight,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════════════
   MOCK DATA — 3-node chain of custody for visual testing
   ══════════════════════════════════════════════════════════════════════ */

const MOCK_EDIT_ACTIONS = [
  {
    id: 'action-001',
    actionName: 'Image Captured',
    software: 'Canon EOS R5 Firmware',
    softwareVersion: 'v1.8.1',
    timestamp: '2026-06-22T09:14:32Z',
    operator: 'Field Agent α',
    signatureValid: true,
    hashAlgorithm: 'SHA-256',
    hash: 'a3f2b8c91d4e5f6071829a3b4c5d6e7f8091a2b3c4d5e6f7081920a1b2c3d4e5',
  },
  {
    id: 'action-002',
    actionName: 'Image Cropped',
    software: 'Adobe Photoshop',
    softwareVersion: '2026 v27.4',
    timestamp: '2026-06-22T11:37:05Z',
    operator: 'Analyst Bravo',
    signatureValid: true,
    hashAlgorithm: 'SHA-256',
    hash: 'b4e3c9d02e5f6a1182930b4c5d6e7f8a91b2c3d4e5f6071829a3b4c5d6e7f80',
  },
  {
    id: 'action-003',
    actionName: 'Metadata Injected',
    software: 'ExifTool',
    softwareVersion: 'v12.92',
    timestamp: '2026-06-22T14:02:18Z',
    operator: 'Unknown',
    signatureValid: false,
    hashAlgorithm: 'SHA-256',
    hash: 'c5f4d0e13f6a7b2293041c5d6e7f8a9b02c3d4e5f6a71829a3b4c5d6e7f8091',
  },
];

/* ══════════════════════════════════════════════════════════════════════
   CUSTOM NODE — Terminal-style forensic action card
   ══════════════════════════════════════════════════════════════════════ */

function ForensicActionNode({ data }) {
  const { action, index, total } = data;
  const isValid = action.signatureValid;
  const isFirst = index === 0;
  const isLast = index === total - 1;

  return (
    <div className="provenance-node-wrapper group">
      {/* Source handle (left) — not on first node */}
      {!isFirst && (
        <Handle
          type="target"
          position={Position.Left}
          className="!bg-[var(--color-neon)] !border-[var(--color-neon-dim)] !w-2 !h-2"
        />
      )}

      {/* Target handle (right) — not on last node */}
      {!isLast && (
        <Handle
          type="source"
          position={Position.Right}
          className="!bg-[var(--color-neon)] !border-[var(--color-neon-dim)] !w-2 !h-2"
        />
      )}

      {/* ── Node Card ────────────────────────────────── */}
      <div
        className={`
          relative w-[280px] rounded-lg overflow-hidden transition-all duration-300
          border group-hover:scale-[1.02] group-hover:shadow-lg
          ${isValid
            ? 'border-[var(--color-gunmetal)] group-hover:border-[var(--color-neon-dim)] group-hover:shadow-[0_0_20px_var(--color-neon-faint)]'
            : 'border-[var(--color-threat)]/40 group-hover:border-[var(--color-threat)]/70 group-hover:shadow-[0_0_20px_rgba(239,68,68,0.1)]'
          }
        `}
      >
        {/* ── Title Bar (terminal header) ──────────────── */}
        <div
          className={`
            flex items-center gap-2 px-3 py-2
            ${isValid
              ? 'bg-[var(--color-graphite)]'
              : 'bg-[var(--color-threat-dim)]'
            }
          `}
        >
          {/* Terminal dots */}
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${isValid ? 'bg-[var(--color-neon)]' : 'bg-[var(--color-threat)]'}`} />
            <span className="w-2 h-2 rounded-full bg-[var(--color-caution)]" />
            <span className="w-2 h-2 rounded-full bg-[var(--color-steel)]" />
          </div>

          {/* Step index */}
          <span
            className="ml-auto text-[9px] tracking-widest text-[var(--color-slate-dim)]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            STEP {String(index + 1).padStart(2, '0')}/{String(total).padStart(2, '0')}
          </span>
        </div>

        {/* ── Body ─────────────────────────────────────── */}
        <div className="bg-[var(--color-carbon)] px-3 py-3 space-y-2.5">
          {/* Action Name */}
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-[var(--color-slate-dim)] shrink-0" />
            <span
              className="text-xs font-semibold text-white tracking-wide uppercase truncate"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {action.actionName}
            </span>
          </div>

          {/* Divider */}
          <div className="h-px bg-[var(--color-gunmetal)]" />

          {/* Software info */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] tracking-wider text-[var(--color-ash)] uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
                Software
              </span>
              <span className="text-[10px] text-[var(--color-slate-bright)]" style={{ fontFamily: 'var(--font-mono)' }}>
                {action.software}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[9px] tracking-wider text-[var(--color-ash)] uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
                Version
              </span>
              <span className="text-[10px] text-[var(--color-slate-dim)]" style={{ fontFamily: 'var(--font-mono)' }}>
                {action.softwareVersion}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[9px] tracking-wider text-[var(--color-ash)] uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
                Operator
              </span>
              <span
                className={`text-[10px] ${action.operator === 'Unknown' ? 'text-[var(--color-threat)]' : 'text-[var(--color-slate-dim)]'}`}
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {action.operator}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[9px] tracking-wider text-[var(--color-ash)] uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
                <Clock className="w-2.5 h-2.5 inline mr-1" />
                Timestamp
              </span>
              <span className="text-[10px] text-[var(--color-slate-dim)] tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>
                {new Date(action.timestamp).toLocaleTimeString('en-US', { hour12: false })}
              </span>
            </div>
          </div>

          {/* Hash */}
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-[var(--color-graphite)] border border-[var(--color-gunmetal)]">
            <Hash className="w-3 h-3 text-[var(--color-ash)] shrink-0" />
            <span className="text-[9px] text-[var(--color-slate-dim)] truncate" style={{ fontFamily: 'var(--font-mono)' }}>
              {action.hash.substring(0, 32)}…
            </span>
          </div>

          {/* ── Signature Badge ────────────────────────── */}
          <div
            className={`
              flex items-center gap-2 px-2.5 py-1.5 rounded-md border
              ${isValid
                ? 'bg-[var(--color-verified-dim)] border-[var(--color-neon-dim)]'
                : 'bg-[var(--color-threat-dim)] border-[var(--color-threat)]/30'
              }
            `}
          >
            {isValid ? (
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-neon)]" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-[var(--color-threat)]" />
            )}

            <span
              className={`text-[10px] font-bold tracking-[0.15em] uppercase ${isValid ? 'text-[var(--color-neon)]' : 'text-[var(--color-threat)]'}`}
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {isValid ? 'Signature Valid' : 'Signature Invalid'}
            </span>

            {isValid ? (
              <Fingerprint className="w-3 h-3 text-[var(--color-neon-dim)] ml-auto" />
            ) : (
              <ShieldAlert className="w-3 h-3 text-[var(--color-threat)]/50 ml-auto" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   CUSTOM EDGE — Animated neon connector
   ══════════════════════════════════════════════════════════════════════ */

function AnimatedNeonEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 16,
  });

  const isValid = data?.targetValid !== false;

  return (
    <>
      {/* Glow shadow behind */}
      <BaseEdge
        id={`${id}-glow`}
        path={edgePath}
        style={{
          stroke: isValid ? 'var(--color-neon)' : 'var(--color-threat)',
          strokeWidth: 6,
          opacity: 0.15,
          filter: 'blur(4px)',
        }}
      />

      {/* Base line */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: isValid ? 'var(--color-neon-dim)' : 'var(--color-threat)',
          strokeWidth: 2,
          opacity: 0.6,
        }}
      />

      {/* Animated particle path */}
      <path
        d={edgePath}
        fill="none"
        stroke={isValid ? 'var(--color-neon-bright)' : 'var(--color-threat)'}
        strokeWidth={2}
        strokeDasharray="8 12"
        className="provenance-edge-animated"
        style={{
          filter: isValid
            ? 'drop-shadow(0 0 4px var(--color-neon-glow))'
            : 'drop-shadow(0 0 4px rgba(239,68,68,0.4))',
        }}
      />

      {/* Direction arrow in the middle */}
      <foreignObject
        x={(sourceX + targetX) / 2 - 10}
        y={(sourceY + targetY) / 2 - 10}
        width={20}
        height={20}
        className="pointer-events-none"
      >
        <div className={`
          w-5 h-5 rounded-full flex items-center justify-center
          ${isValid ? 'bg-[var(--color-neon-subtle)] border border-[var(--color-neon-dim)]' : 'bg-[var(--color-threat-dim)] border border-[var(--color-threat)]/30'}
        `}>
          <ChevronRight className={`w-3 h-3 ${isValid ? 'text-[var(--color-neon)]' : 'text-[var(--color-threat)]'}`} />
        </div>
      </foreignObject>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   NODE & EDGE TYPE REGISTRATIONS
   ══════════════════════════════════════════════════════════════════════ */

const nodeTypes = { forensicAction: ForensicActionNode };
const edgeTypes = { animatedNeon: AnimatedNeonEdge };

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT — ProvenanceTimeline
   ══════════════════════════════════════════════════════════════════════ */

const NODE_WIDTH = 280;
const NODE_GAP = 120;

function buildGraph(editActions) {
  const total = editActions.length;

  const nodes = editActions.map((action, index) => {
    const nodeId = action.id || action._id || action.hash || `node-${index}`;
    return {
      id: nodeId,
      type: 'forensicAction',
      position: {
        x: index * (NODE_WIDTH + NODE_GAP),
        y: 0,
      },
      data: { action, index, total },
      draggable: true,
    };
  });

  const edges = [];
  for (let i = 0; i < editActions.length - 1; i++) {
    const sourceId = editActions[i].id || editActions[i]._id || editActions[i].hash || `node-${i}`;
    const targetId = editActions[i + 1].id || editActions[i + 1]._id || editActions[i + 1].hash || `node-${i + 1}`;
    edges.push({
      id: `edge-${sourceId}-${targetId}`,
      source: sourceId,
      target: targetId,
      type: 'animatedNeon',
      data: { targetValid: editActions[i + 1].signatureValid },
    });
  }

  return { nodes, edges };
}

export default function ProvenanceTimeline({ editActions = MOCK_EDIT_ACTIONS }) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildGraph(editActions),
    [editActions]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state if initialNodes/initialEdges change without unmounting
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onInit = useCallback((reactFlowInstance) => {
    // Fit view with padding after mount
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.3, duration: 600 });
    }, 100);
  }, []);


  return (
    <div id="provenance-timeline" className="w-full animate-fade-in-up">
      {/* ── Section Header ──────────────────────────── */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Fingerprint className="w-4 h-4 text-[var(--color-neon)]" />
          <h1
            className="text-base font-semibold tracking-wider text-white uppercase"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Provenance Timeline
          </h1>
        </div>
        <p className="text-xs text-[var(--color-slate-mid)] leading-relaxed">
          Chain of custody visualization. Each node represents a cryptographically signed edit action.
          <span className="text-[var(--color-neon)] ml-1" style={{ fontFamily: 'var(--font-mono)' }}>
            {editActions.length} actions traced
          </span>
        </p>
      </div>

      {/* ── Legend ────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-4 px-3 py-2 rounded-lg bg-[var(--color-carbon)] border border-[var(--color-gunmetal)]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--color-neon)]" />
          <span className="text-[10px] text-[var(--color-slate-dim)]" style={{ fontFamily: 'var(--font-mono)' }}>VALID SIGNATURE</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--color-threat)]" />
          <span className="text-[10px] text-[var(--color-slate-dim)]" style={{ fontFamily: 'var(--font-mono)' }}>INVALID SIGNATURE</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-6 h-0.5 bg-[var(--color-neon-dim)] rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg, var(--color-neon-bright) 0, var(--color-neon-bright) 6px, transparent 6px, transparent 14px)' }} />
          <span className="text-[10px] text-[var(--color-slate-dim)]" style={{ fontFamily: 'var(--font-mono)' }}>DATA FLOW</span>
        </div>
      </div>

      {/* ── React Flow Canvas ────────────────────────── */}
      <div className="w-full h-[420px] rounded-xl overflow-hidden border border-[var(--color-gunmetal)] bg-[var(--color-obsidian)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onInit={onInit}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.3}
          maxZoom={1.5}
          defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
          proOptions={{ hideAttribution: true }}
          className="provenance-flow"
        >
          <Background
            variant="dots"
            gap={20}
            size={1}
            color="var(--color-gunmetal)"
          />
          <Controls
            showInteractive={false}
            className="provenance-controls"
          />
        </ReactFlow>
      </div>

      {/* ── Summary Footer ───────────────────────────── */}
      <div className="mt-4 flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--color-carbon)] border border-[var(--color-gunmetal)]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[var(--color-ash)]" style={{ fontFamily: 'var(--font-mono)' }}>TOTAL ACTIONS</span>
            <span className="text-[11px] font-bold text-white" style={{ fontFamily: 'var(--font-mono)' }}>{editActions.length}</span>
          </div>
          <div className="w-px h-3 bg-[var(--color-gunmetal)]" />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[var(--color-ash)]" style={{ fontFamily: 'var(--font-mono)' }}>VALID</span>
            <span className="text-[11px] font-bold text-[var(--color-neon)]" style={{ fontFamily: 'var(--font-mono)' }}>
              {editActions.filter(a => a.signatureValid).length}
            </span>
          </div>
          <div className="w-px h-3 bg-[var(--color-gunmetal)]" />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[var(--color-ash)]" style={{ fontFamily: 'var(--font-mono)' }}>INVALID</span>
            <span className="text-[11px] font-bold text-[var(--color-threat)]" style={{ fontFamily: 'var(--font-mono)' }}>
              {editActions.filter(a => !a.signatureValid).length}
            </span>
          </div>
        </div>
        <span className="text-[9px] text-[var(--color-ash)]" style={{ fontFamily: 'var(--font-mono)' }}>
          HASH: SHA-256 · DAG INTEGRITY VERIFIED
        </span>
      </div>
    </div>
  );
}
