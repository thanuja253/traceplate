import type { GraphEdge, GraphNode } from "@/lib/types";

const KIND_ORDER = ["Farm", "Processor", "Distributor", "Restaurant"];
const LEFT = 72;
const RIGHT = 210;

function collect(edges: GraphEdge[], origin: GraphNode) {
  const nodes = new Map<string, GraphNode>();
  nodes.set(origin.id, origin);
  for (const e of edges) {
    nodes.set(e.fromId, {
      id: e.fromId,
      name: e.fromName,
      kind: e.fromKind,
    });
    nodes.set(e.toId, {
      id: e.toId,
      name: e.toName,
      kind: e.toKind,
    });
  }
  const columns = KIND_ORDER.map((kind) =>
    [...nodes.values()]
      .filter((n) => n.kind === kind)
      .sort((a, b) => a.name.localeCompare(b.name)),
  );
  return { nodes, columns };
}

function pos(
  columns: GraphNode[][],
  id: string,
  width: number,
  height: number,
): { x: number; y: number } | null {
  const span = width - LEFT - RIGHT;
  for (let c = 0; c < columns.length; c++) {
    const i = columns[c].findIndex((n) => n.id === id);
    if (i === -1) continue;
    const col = columns[c];
    const x = LEFT + c * (span / Math.max(columns.length - 1, 1));
    const y = col.length === 1 ? height / 2 : 36 + (i * (height - 72)) / (col.length - 1);
    return { x, y };
  }
  return null;
}

export function LayeredGraph({
  origin,
  edges,
  labels = ["Farm", "Packers", "Distributors", "Restaurants"],
}: {
  origin: GraphNode;
  edges: GraphEdge[];
  labels?: string[];
}) {
  if (edges.length === 0) {
    return <div className="empty">No path to draw for this place.</div>;
  }

  const width = 1100;
  const { columns } = collect(edges, origin);
  const tallest = Math.max(...columns.map((c) => c.length), 1);
  const height = Math.max(280, 56 + tallest * 42);
  const span = width - LEFT - RIGHT;

  return (
    <div className="layers" aria-label="Supply path">
      <svg viewBox={`0 0 ${width} ${height + 28}`} width="100%" role="img">
        {labels.map((label, i) => (
          <text
            key={label}
            x={LEFT + i * (span / 3)}
            y="16"
            textAnchor="middle"
            fill="#6d5f4e"
            fontSize="11"
            letterSpacing="0.12em"
            fontFamily="IBM Plex Mono, monospace"
          >
            {label.toUpperCase()}
          </text>
        ))}
        {edges.map((e, i) => {
          const a = pos(columns, e.fromId, width, height);
          const b = pos(columns, e.toId, width, height);
          if (!a || !b) return null;
          return (
            <path
              key={`${e.fromId}-${e.toId}-${e.rel}-${i}`}
              d={`M ${a.x} ${a.y + 28} C ${(a.x + b.x) / 2} ${a.y + 28}, ${(a.x + b.x) / 2} ${b.y + 28}, ${b.x} ${b.y + 28}`}
              fill="none"
              stroke="#c4b396"
              strokeWidth="1.2"
            />
          );
        })}
        {columns.flatMap((col) =>
          col.map((node) => {
            const p = pos(columns, node.id, width, height);
            if (!p) return null;
            const fill =
              node.kind === "Farm"
                ? "#9c2b1a"
                : node.kind === "Restaurant"
                  ? "#2d4a3c"
                  : "#1b1612";
            return (
              <g key={node.id} transform={`translate(${p.x}, ${p.y + 28})`}>
                <circle r="5.5" fill={fill} />
                <text
                  x="10"
                  y="4"
                  fill="#1b1612"
                  fontSize="11"
                  fontFamily="Figtree, sans-serif"
                >
                  {node.name}
                </text>
              </g>
            );
          }),
        )}
      </svg>
    </div>
  );
}
