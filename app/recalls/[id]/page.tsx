import Link from "next/link";
import { notFound } from "next/navigation";
import { LayeredGraph } from "@/components/LayeredGraph";
import { DatabaseDown, EmptyState, QueryNote } from "@/components/States";
import { CYPHER } from "@/lib/cypher";
import { formatDate, hopLabel, kindLabel, stampLabel } from "@/lib/format";
import { DatabaseUnavailableError } from "@/lib/neo4j";
import { getRecall } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function RecallPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const detail = await getRecall(id);
    if (!detail) notFound();

    const { recall, origin, edges, kitchens, processors, distributors } = detail;
    const cities = [...new Set(kitchens.map((k) => k.city))].sort();

    return (
      <main>
        <div className="page-head">
          <p className="crumb">
            <Link href="/">Recalls</Link> / {recall.title}
          </p>
          <div className={`stamp ${recall.severity}`}>{stampLabel(recall.severity)}</div>
          <h1>{recall.title}</h1>
          <p className="lede">
            Found {formatDate(recall.date)} at {kindLabel(origin.kind).toLowerCase()}{" "}
            {origin.name}
            {origin.city ? ` · ${origin.city}, ${origin.state}` : ""}. {recall.summary}
          </p>
        </div>

        <div className="stats" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 24 }}>
          <div className="stat">
            <b>{kitchens.length}</b>
            <span>restaurants</span>
          </div>
          <div className="stat">
            <b>{cities.length}</b>
            <span>cities</span>
          </div>
          <div className="stat">
            <b>{processors.length}</b>
            <span>packers</span>
          </div>
          <div className="stat">
            <b>{distributors.length}</b>
            <span>distributors</span>
          </div>
        </div>

        <div className="section-head">
          <h2>Who received this food?</h2>
          <p>Farm → packer → distributor → restaurant.</p>
        </div>
        <LayeredGraph origin={origin} edges={edges} />
        <QueryNote title="Query used for this map" cypher={CYPHER.blastRadiusEdges} />

        <div className="section-head">
          <h2>Restaurants that may have this food</h2>
          <p>Steps = how many stops from the farm to the restaurant.</p>
        </div>

        {kitchens.length === 0 ? (
          <EmptyState
            title="No restaurants on this path"
            body="This farm or packer does not reach a restaurant in the data."
          />
        ) : (
          <div className="panel" style={{ padding: 0, overflow: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Restaurant</th>
                  <th>City</th>
                  <th>Steps</th>
                  <th>Dishes that use this ingredient</th>
                </tr>
              </thead>
              <tbody>
                {kitchens.map((k) => (
                  <tr key={k.id}>
                    <td>
                      <Link href={`/kitchens/${k.id}`}>{k.name}</Link>
                      <div className="muted small">{k.cuisine}</div>
                    </td>
                    <td>
                      {k.city}, {k.state}
                    </td>
                    <td className="mono">{hopLabel(k.hops)}</td>
                    <td>
                      {k.dishes.length === 0 ? (
                        <span className="muted">On the supply path — not on the menu</span>
                      ) : (
                        k.dishes.map((d) => (
                          <span key={d} className="tag">
                            {d}
                          </span>
                        ))
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    );
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) {
      return (
        <main>
          <DatabaseDown message={err.message} />
        </main>
      );
    }
    throw err;
  }
}
