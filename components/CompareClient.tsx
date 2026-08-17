"use client";

import { useMemo, useState } from "react";
import { QueryNote } from "./States";
import { CYPHER } from "@/lib/cypher";
import { hopLabel, kindLabel } from "@/lib/format";
import type { SharedSource } from "@/lib/types";

type Kitchen = {
  id: string;
  name: string;
  city: string;
  state: string;
  cuisine: string;
};

export function CompareClient({ kitchens }: { kitchens: Kitchen[] }) {
  const defaults = useMemo(() => {
    const a = kitchens.find((k) => k.id === "rst-fennel") ?? kitchens[0];
    const b = kitchens.find((k) => k.id === "rst-westloop") ?? kitchens[1] ?? kitchens[0];
    return { a: a?.id ?? "", b: b?.id ?? "" };
  }, [kitchens]);

  const [idA, setIdA] = useState(defaults.a);
  const [idB, setIdB] = useState(defaults.b);
  const [rows, setRows] = useState<SharedSource[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/compare?a=${encodeURIComponent(idA)}&b=${encodeURIComponent(idB)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Compare failed");
      setRows(data.sources ?? []);
    } catch (err) {
      setRows(null);
      setError(err instanceof Error ? err.message : "Compare failed");
    } finally {
      setLoading(false);
    }
  }

  const grouped = group(rows ?? []);

  return (
    <>
      <form className="row-form" onSubmit={onSubmit}>
        <label>
          <span className="muted small">Restaurant A</span>
          <select value={idA} onChange={(e) => setIdA(e.target.value)}>
            {kitchens.map((k) => (
              <option key={k.id} value={k.id}>
                {k.city} — {k.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="muted small">Restaurant B</span>
          <select value={idB} onChange={(e) => setIdB(e.target.value)}>
            {kitchens.map((k) => (
              <option key={k.id} value={k.id}>
                {k.city} — {k.name}
              </option>
            ))}
          </select>
        </label>
        <button className="btn" type="submit" disabled={loading || !idA || !idB}>
          {loading ? "Searching…" : "Find shared suppliers"}
        </button>
      </form>

      {error && (
        <div className="banner" role="alert">
          <h2>Could not compare</h2>
          <p>{error}</p>
        </div>
      )}

      {rows && rows.length === 0 && !error && (
        <div className="empty">
          <h2>No shared supplier</h2>
          <p>These two restaurants do not share a farm, packer or distributor in this data.</p>
        </div>
      )}

      {rows && rows.length > 0 && (
        <>
          {(["Farm", "Processor", "Distributor"] as const).map((kind) => {
            const list = grouped[kind];
            if (!list.length) return null;
            return (
              <section key={kind} style={{ marginBottom: 28 }}>
                <div className="section-head">
                  <h2>{kindLabel(kind)}s that reach both</h2>
                  <p>{list.length} shared {kindLabel(kind).toLowerCase()}(s)</p>
                </div>
                <div className="shared-list">
                  {list.map((row) => (
                    <div key={row.id} className="shared-item">
                      <span className="mono">
                        {hopLabel(row.hopsToA)} / {hopLabel(row.hopsToB)}
                      </span>
                      <div>
                        <strong>{row.name}</strong>
                        <div className="muted small">{row.region}</div>
                      </div>
                      <span className="muted small">steps to A / B</span>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
          <QueryNote title="Query for shared suppliers" cypher={CYPHER.sharedSources} />
        </>
      )}
    </>
  );
}

function group(rows: SharedSource[]) {
  return {
    Farm: rows.filter((r) => r.kind === "Farm"),
    Processor: rows.filter((r) => r.kind === "Processor"),
    Distributor: rows.filter((r) => r.kind === "Distributor"),
  };
}
