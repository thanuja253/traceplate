import Link from "next/link";

export function DatabaseDown({ message }: { message?: string }) {
  return (
    <section className="banner" role="alert">
      <p className="kicker">Database not connected</p>
      <h2>CognoDB is not answering.</h2>
      <p>
        {message ||
          "Check that your CognoDB instance is running and that COGNODB_URI / COGNODB_PASSWORD are set in .env."}
      </p>
      <p className="small muted">
        Then run <span className="mono">npm run seed</span>.
      </p>
    </section>
  );
}

export function EmptyState({
  title,
  body,
  href,
  action,
}: {
  title: string;
  body: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="empty">
      <h2>{title}</h2>
      <p>{body}</p>
      {href && action ? (
        <p>
          <Link href={href}>{action}</Link>
        </p>
      ) : null}
    </div>
  );
}

export function QueryNote({ title, cypher }: { title: string; cypher: string }) {
  return (
    <details className="query-note">
      <summary>{title}</summary>
      <pre>{cypher.trim()}</pre>
    </details>
  );
}
