"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  disabled?: boolean;
};

const templates = [
  { value: "web_app", label: "Web App" },
  { value: "mobile_app", label: "Mobile App" },
  { value: "internal_tool", label: "Internal Tool" }
];

export function FeatureForm({ disabled }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      title: String(formData.get("title") || ""),
      templateType: String(formData.get("templateType") || "web_app"),
      goal: String(formData.get("goal") || ""),
      users: String(formData.get("users") || ""),
      constraints: String(formData.get("constraints") || ""),
      riskUnknowns: String(formData.get("riskUnknowns") || "")
    };

    setLoading(true);
    try {
      const response = await fetch("/api/generate-spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Generation failed.");
      }

      router.push(`/specs/${data.specId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className="rounded-2xl border border-zinc-300 bg-white p-5 shadow-[0_16px_30px_rgba(17,17,17,0.08)]"
      onSubmit={onSubmit}
    >
      <h2 className="mb-2.5 text-xl font-semibold">1) Describe the feature idea</h2>
      <p className="text-zinc-500">Fill the brief, generate stories/tasks, then refine and export.</p>

      <label htmlFor="title" className="mb-2 mt-4 block text-sm font-bold">Spec title</label>
      <input
        id="title"
        name="title"
        placeholder="Example: Team Onboarding Assistant"
        required
        minLength={3}
        maxLength={120}
        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm transition focus:border-zinc-500 focus:outline-none focus:ring-4 focus:ring-zinc-400/20"
      />

      <label htmlFor="templateType" className="mb-2 mt-4 block text-sm font-bold">Template</label>
      <select
        id="templateType"
        name="templateType"
        defaultValue="web_app"
        className="w-full cursor-pointer rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm transition hover:border-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-4 focus:ring-zinc-400/20"
      >
        {templates.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <label htmlFor="goal" className="mb-2 mt-4 block text-sm font-bold">Goal</label>
      <textarea
        id="goal"
        name="goal"
        minLength={10}
        maxLength={500}
        required
        placeholder="What is the outcome this feature should drive?"
        className="min-h-[110px] w-full resize-y rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm transition focus:border-zinc-500 focus:outline-none focus:ring-4 focus:ring-zinc-400/20"
      />

      <label htmlFor="users" className="mb-2 mt-4 block text-sm font-bold">Users</label>
      <textarea
        id="users"
        name="users"
        minLength={5}
        maxLength={300}
        required
        placeholder="Who will use this and what are their needs?"
        className="min-h-[110px] w-full resize-y rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm transition focus:border-zinc-500 focus:outline-none focus:ring-4 focus:ring-zinc-400/20"
      />

      <label htmlFor="constraints" className="mb-2 mt-4 block text-sm font-bold">Constraints</label>
      <textarea
        id="constraints"
        name="constraints"
        minLength={5}
        maxLength={500}
        required
        placeholder="Technical, budget, timeline, or compliance constraints"
        className="min-h-[110px] w-full resize-y rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm transition focus:border-zinc-500 focus:outline-none focus:ring-4 focus:ring-zinc-400/20"
      />

      <label htmlFor="riskUnknowns" className="mb-2 mt-4 block text-sm font-bold">Risks / Unknowns (optional)</label>
      <textarea
        id="riskUnknowns"
        name="riskUnknowns"
        maxLength={500}
        placeholder="Anything unclear or risky so far"
        className="min-h-[110px] w-full resize-y rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm transition focus:border-zinc-500 focus:outline-none focus:ring-4 focus:ring-zinc-400/20"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={loading || disabled}
          className="rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-zinc-950 hover:shadow-[0_10px_18px_rgba(17,17,17,0.2)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Generating..." : "Generate Plan"}
        </button>
      </div>

      {error && <p className="mt-2 text-red-700">{error}</p>}
    </form>
  );
}
