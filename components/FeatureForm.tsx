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
    <form className="panel" onSubmit={onSubmit}>
      <h2 className="section-title">1) Describe the feature idea</h2>
      <p className="muted">Fill the brief, generate stories/tasks, then refine and export.</p>

      <label htmlFor="title">Spec title</label>
      <input id="title" name="title" placeholder="Example: Team Onboarding Assistant" required minLength={3} maxLength={120} />

      <label htmlFor="templateType">Template</label>
      <select id="templateType" name="templateType" defaultValue="web_app">
        {templates.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <label htmlFor="goal">Goal</label>
      <textarea id="goal" name="goal" minLength={10} maxLength={500} required placeholder="What is the outcome this feature should drive?" />

      <label htmlFor="users">Users</label>
      <textarea id="users" name="users" minLength={5} maxLength={300} required placeholder="Who will use this and what are their needs?" />

      <label htmlFor="constraints">Constraints</label>
      <textarea id="constraints" name="constraints" minLength={5} maxLength={500} required placeholder="Technical, budget, timeline, or compliance constraints" />

      <label htmlFor="riskUnknowns">Risks / Unknowns (optional)</label>
      <textarea id="riskUnknowns" name="riskUnknowns" maxLength={500} placeholder="Anything unclear or risky so far" />

      <div className="row" style={{ marginTop: 12 }}>
        <button type="submit" disabled={loading || disabled}>
          {loading ? "Generating..." : "Generate Plan"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}
    </form>
  );
}
