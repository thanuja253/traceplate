import Link from "next/link";
import { notFound } from "next/navigation";
import { LayeredGraph } from "@/components/LayeredGraph";
import { DatabaseDown, QueryNote } from "@/components/States";
import { CYPHER } from "@/lib/cypher";
import { hopLabel } from "@/lib/format";
import { DatabaseUnavailableError } from "@/lib/neo4j";
import { getKitchen } from "@/lib/queries";
import type { GraphNode } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function KitchenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const kitchen = await getKitchen(id);
    if (!kitchen) notFound();

    const origin: GraphNode = {
      id: kitchen.id,
      name: kitchen.name,
      kind: "Restaurant",
    };

    return (
      <main>
        <div className="page-head">
          <p className="crumb">
            <Link href="/">Recalls</Link> / {kitchen.name}
          </p>
          <p className="kicker">{kitchen.cuisine}</p>
          <h1>{kitchen.name}</h1>
          <p className="lede">
            {kitchen.neighborhood}, {kitchen.city}, {kitchen.state}. Farms, packers
            and distributors that send food here.
          </p>
        </div>

        {kitchen.pathToRecalls.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <div className="section-head">
              <h2>Linked to a recall</h2>
              <p>Shortest path from the unsafe farm or packer to this restaurant.</p>
            </div>
            <div className="shared-list">
              {kitchen.pathToRecalls.map((path) => (
                <Link key={path.recallId} href={`/recalls/${path.recallId}`} className="shared-item">
                  <span className="stamp outbreak">{hopLabel(path.hops)}</span>
                  <div>
                    <strong>{path.recallTitle}</strong>
                    <div className="path">
                      {path.via.map((step, i) => (
                        <span key={`${step}-${i}`}>
                          {i > 0 && <span className="sep"> → </span>}
                          {step}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="muted small">{path.contaminant}</span>
                </Link>
              ))}
            </div>
            <QueryNote title="Query for recall paths" cypher={CYPHER.kitchenRecallPaths} />
          </section>
        )}

        <div className="section-head">
          <h2>Who supplies this restaurant?</h2>
          <p>The same path, read backwards from the kitchen.</p>
        </div>
        <LayeredGraph
          origin={origin}
          edges={kitchen.upstream}
          labels={["Farms", "Packers", "Distributors", "Kitchen"]}
        />

        <div className="section-head">
          <h2>Menu</h2>
          <p>Dishes served here, with ingredients from the graph.</p>
        </div>
        <div className="panel" style={{ padding: 0, overflow: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Dish</th>
                <th>Course</th>
                <th>Ingredients</th>
              </tr>
            </thead>
            <tbody>
              {kitchen.dishes.map((dish) => (
                <tr key={dish.id}>
                  <td>{dish.name}</td>
                  <td>{dish.course}</td>
                  <td>
                    {dish.ingredients.map((ing) => (
                      <span key={ing} className="tag">
                        {ing}
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
