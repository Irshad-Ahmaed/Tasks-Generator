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
    <section className="grid gap-5 pb-8 pt-5">
      <div className="rounded-2xl border border-zinc-300 bg-white p-5 shadow-[0_16px_30px_rgba(17,17,17,0.08)]">
        <h1 className="mt-0 text-[1.8rem] font-bold leading-tight">System Status</h1>
        <p className="text-zinc-500">Live health check for backend, database, and LLM connection.</p>
      </div>

      {error && <p className="mt-2 text-red-700">{error}</p>}

      {!status && !error && (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="rounded-2xl border border-zinc-300 bg-white p-4">
              <div className="mb-2.5 h-4 w-[55%] animate-pulse rounded-lg bg-zinc-200" />
              <div className="h-3 w-[85%] animate-pulse rounded-lg bg-zinc-200" />
            </div>
          ))}
        </div>
      )}

      {status && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-2xl border border-zinc-300 bg-white p-5 shadow-[0_16px_30px_rgba(17,17,17,0.08)] after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:bg-zinc-500">
            <h2 className="mb-2.5 text-xl font-semibold">Backend</h2>
            <p>{status.backend}</p>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-zinc-300 bg-white p-5 shadow-[0_16px_30px_rgba(17,17,17,0.08)] after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:bg-zinc-500">
            <h2 className="mb-2.5 text-xl font-semibold">Database</h2>
            <p>{status.database}</p>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-zinc-300 bg-white p-5 shadow-[0_16px_30px_rgba(17,17,17,0.08)] after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:bg-zinc-500">
            <h2 className="mb-2.5 text-xl font-semibold">LLM</h2>
            <p>{status.llm}</p>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-zinc-300 bg-white p-5 shadow-[0_16px_30px_rgba(17,17,17,0.08)] after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:bg-zinc-500">
            <h2 className="mb-2.5 text-xl font-semibold">Checked At</h2>
            <p>{new Date(status.timestamp).toLocaleString()}</p>
          </div>
        </div>
      )}
    </section>
  );
}
