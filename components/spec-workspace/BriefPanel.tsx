"use client";

type Props = {
  goal: string;
  users: string;
  constraints: string;
  riskUnknowns: string | null;
  message: string | null;
  saving: boolean;
};

export function BriefPanel({ goal, users, constraints, riskUnknowns, message, saving }: Props) {
  return (
    <aside className="rounded-2xl border border-zinc-300 bg-white p-5 shadow-[0_16px_30px_rgba(17,17,17,0.08)]">
      <h2 className="mb-2.5 text-xl font-semibold">Brief</h2>
      <p>
        <strong>Goal:</strong> {goal}
      </p>
      <p>
        <strong>Users:</strong> {users}
      </p>
      <p>
        <strong>Constraints:</strong> {constraints}
      </p>
      <p>
        <strong>Risks/Unknowns:</strong> {riskUnknowns || "Not provided."}
      </p>
      {message && <p className="text-zinc-500">{message}</p>}
      {saving && <p className="text-zinc-500">Saving task order...</p>}
    </aside>
  );
}
