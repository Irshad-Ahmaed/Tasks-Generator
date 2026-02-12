export default function GlobalLoading() {
  return (
    <section className="grid gap-5 pb-8 pt-5">
      <div className="rounded-2xl border border-zinc-300 bg-white p-5 shadow-[0_16px_30px_rgba(17,17,17,0.08)]">
        <div className="mb-3.5 h-[26px] w-[38%] animate-pulse rounded-lg bg-zinc-200" />
        <div className="mb-2 h-3.5 w-[72%] animate-pulse rounded-lg bg-zinc-200" />
        <div className="h-3.5 w-[58%] animate-pulse rounded-lg bg-zinc-200" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-300 bg-white p-4">
          <div className="mb-2.5 h-4 w-[55%] animate-pulse rounded-lg bg-zinc-200" />
          <div className="mb-2 h-3 w-[85%] animate-pulse rounded-lg bg-zinc-200" />
          <div className="mb-2 h-3 w-[92%] animate-pulse rounded-lg bg-zinc-200" />
          <div className="h-3 w-[68%] animate-pulse rounded-lg bg-zinc-200" />
        </div>

        <div className="rounded-2xl border border-zinc-300 bg-white p-4">
          <div className="mb-2.5 h-4 w-[46%] animate-pulse rounded-lg bg-zinc-200" />
          <div className="mb-2 h-3 w-[84%] animate-pulse rounded-lg bg-zinc-200" />
          <div className="h-3 w-[62%] animate-pulse rounded-lg bg-zinc-200" />
        </div>
      </div>
    </section>
  );
}
