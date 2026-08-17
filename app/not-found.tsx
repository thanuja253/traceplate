import Link from "next/link";

export default function NotFound() {
  return (
    <main>
      <div className="page-head">
        <p className="kicker">Not found</p>
        <h1>That page is not here.</h1>
        <p className="lede">
          This restaurant or recall is not in the data.{" "}
          <Link href="/">Back to recalls</Link>.
        </p>
      </div>
    </main>
  );
}
