import Link from "next/link";
import { DatabaseDown, EmptyState } from "@/components/States";
import { DatabaseUnavailableError } from "@/lib/neo4j";
import { searchGraph } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;

  try {
    const hits = await searchGraph(q);

    return (
      <main>
        <div className="page-head">
          <p className="kicker">Search</p>
          <h1>{q.trim() ? `Results for “${q.trim()}”` : "Search"}</h1>
          <p className="lede">Try palak, paneer, prawns, Cafe Madras or Indian Accent.</p>
        </div>

        {!q.trim() ? (
          <EmptyState
            title="Type a name above"
            body="Try palak, paneer, or Cafe Madras."
          />
        ) : hits.length === 0 ? (
          <EmptyState
            title="No matches"
            body="Nothing in the data contains that name."
            href="/"
            action="Back to recalls"
          />
        ) : (
          <div className="shared-list">
            {hits.map((hit) => (
              <Link key={`${hit.kind}-${hit.id}`} href={hit.href} className="shared-item">
                <span className="kind-chip">{hit.kind}</span>
                <div>
                  <strong>{hit.name}</strong>
                  <div className="muted small">{hit.subtitle}</div>
                </div>
                <span className="muted small">{hit.kind === "Restaurant" || hit.kind === "Recall" ? "Open →" : ""}</span>
              </Link>
            ))}
          </div>
        )}
      </main>
    );
  } catch (err) {
    return (
      <main>
        <DatabaseDown
          message={
            err instanceof DatabaseUnavailableError || err instanceof Error
              ? err.message
              : undefined
          }
        />
      </main>
    );
  }
}
