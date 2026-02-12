"use client";

import { useEffect, useState } from "react";

type StatusResponse = {
  backend: string;
  database: string;
  llm: string;
  timestamp: string;
};

export default function StatusPage() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/status", { cache: "no-store" });
        const data = (await response.json()) as StatusResponse;
        if (!response.ok) {
          throw new Error("Status check failed");
        }
        setStatus(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown status error");
      }
    }

    load();
  }, []);

  return (
    <section className="grid" style={{ gap: 20, paddingTop: 20, paddingBottom: 30 }}>
      <div className="panel">
        <h1 className="hero-title" style={{ marginTop: 0, fontSize: "1.8rem" }}>System Status</h1>
        <p className="muted">Live health check for backend, database, and LLM connection.</p>
      </div>

      {error && <p className="error">{error}</p>}

      {!status && !error && (
        <div className="grid two">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="skeleton-card">
              <div className="skeleton-line title" />
              <div className="skeleton-line body" />
            </div>
          ))}
        </div>
      )}

      {status && (
        <div className="grid two">
          <div className="panel status-card">
            <h2 className="section-title">Backend</h2>
            <p>{status.backend}</p>
          </div>
          <div className="panel status-card">
            <h2 className="section-title">Database</h2>
            <p>{status.database}</p>
          </div>
          <div className="panel status-card">
            <h2 className="section-title">LLM</h2>
            <p>{status.llm}</p>
          </div>
          <div className="panel status-card">
            <h2 className="section-title">Checked At</h2>
            <p>{new Date(status.timestamp).toLocaleString()}</p>
          </div>
        </div>
      )}
    </section>
  );
}
