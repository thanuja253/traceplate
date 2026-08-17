export default function Loading() {
  return (
    <main>
      <div className="page-head">
        <div className="skeleton" style={{ width: "40%" }} />
        <div className="skeleton" style={{ width: "70%", height: 36 }} />
      </div>
      <div className="skeleton" style={{ height: 160 }} />
      <div className="skeleton" style={{ height: 120 }} />
    </main>
  );
}
