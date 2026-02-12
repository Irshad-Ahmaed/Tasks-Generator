export default function GlobalLoading() {
  return (
    <section className="grid" style={{ gap: 20, paddingTop: 20, paddingBottom: 30 }}>
      <div className="panel">
        <div className="skeleton-line title" style={{ width: "38%", height: 26, marginBottom: 14 }} />
        <div className="skeleton-line body" style={{ width: "72%", height: 14, marginBottom: 8 }} />
        <div className="skeleton-line body" style={{ width: "58%", height: 14 }} />
      </div>

      <div className="grid two">
        <div className="skeleton-card">
          <div className="skeleton-line title" />
          <div className="skeleton-line body" style={{ marginBottom: 8 }} />
          <div className="skeleton-line body" style={{ width: "92%", marginBottom: 8 }} />
          <div className="skeleton-line body" style={{ width: "68%" }} />
        </div>

        <div className="skeleton-card">
          <div className="skeleton-line title" style={{ width: "46%" }} />
          <div className="skeleton-line body" style={{ width: "84%", marginBottom: 8 }} />
          <div className="skeleton-line body" style={{ width: "62%" }} />
        </div>
      </div>
    </section>
  );
}
