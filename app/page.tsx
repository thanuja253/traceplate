import Link from "next/link";
import { DatabaseDown } from "@/components/States";
import { formatDate, stampLabel } from "@/lib/format";
import { DatabaseUnavailableError } from "@/lib/neo4j";
import { getOverview } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  try {
    const { counts, recalls } = await getOverview();
    const active = recalls.filter((r) => r.status === "active");
    const rest = recalls.filter((r) => r.status !== "active");

    return (
      <main>
        <section className="hero">
          <div>
            <p className="kicker">Food safety tracker</p>
            <h1>If a farm is unsafe, the food has already left.</h1>
            <p className="lede">
              Follow palak, paneer, prawns or chicken from the farm to the restaurant
              that served it.
            </p>
          </div>
          <div className="stats">
            <div className="stat">
              <b>{counts.restaurants}</b>
              <span>restaurants</span>
            </div>
            <div className="stat">
              <b>{counts.farms}</b>
              <span>farms</span>
            </div>
            <div className="stat">
              <b>{counts.recalls}</b>
              <span>recalls</span>
            </div>
            <div className="stat">
              <b>{counts.relationships}</b>
              <span>connections</span>
            </div>
          </div>
        </section>

        <div className="section-head">
          <h2>Open recalls</h2>
          <p>
            {counts.processors} packers · {counts.distributors} distributors ·{" "}
            {counts.ingredients} ingredients
          </p>
        </div>

        {active.length === 0 ? (
          <p className="muted">No active recalls in the graph. Run the seed script.</p>
        ) : (
          <div className="cards">
            {active.map((recall) => (
              <Link key={recall.id} href={`/recalls/${recall.id}`} className="card">
                <div className={`stamp ${recall.severity}`}>{stampLabel(recall.severity)}</div>
                <h3>{recall.title}</h3>
                <p className="meta">
                  {formatDate(recall.date)} · {recall.originKind} · {recall.originName}
                </p>
                <p className="small">{recall.summary}</p>
                <div className="pills">
                  <span className="pill">{recall.restaurantsAtRisk} restaurants</span>
                  <span className="pill">{recall.citiesAtRisk} cities</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {rest.length > 0 && (
          <>
            <div className="section-head">
              <h2>Closed</h2>
            </div>
            <div className="cards">
              {rest.map((recall) => (
                <Link key={recall.id} href={`/recalls/${recall.id}`} className="card">
                  <div className={`stamp ${recall.status}`}>{stampLabel(recall.status)}</div>
                  <h3>{recall.title}</h3>
                  <p className="meta">
                    {formatDate(recall.date)} · {recall.originName} ·{" "}
                    {recall.restaurantsAtRisk} restaurants
                  </p>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : undefined;
    return (
      <main>
        <section className="hero">
          <div>
            <p className="kicker">Food safety tracker</p>
            <h1>If a farm is unsafe, the food has already left.</h1>
          </div>
        </section>
        <DatabaseDown
          message={
            err instanceof DatabaseUnavailableError
              ? message
              : message || "Could not load recalls from CognoDB."
          }
        />
      </main>
    );
  }
}
