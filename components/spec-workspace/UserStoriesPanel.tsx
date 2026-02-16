"use client";

import { ApiSpec } from "@/lib/types";

type Props = {
  userStories: ApiSpec["userStories"];
};

export function UserStoriesPanel({ userStories }: Props) {
  return (
    <article className="rounded-2xl border border-zinc-300 bg-white p-5 shadow-[0_16px_30px_rgba(17,17,17,0.08)]">
      <h2 className="mb-2.5 text-xl font-semibold">User Stories</h2>
      {userStories.map((story, idx) => (
        <div
          key={story.id}
          className="mb-2 rounded-xl border border-zinc-300 bg-white p-3 transition hover:-translate-y-0.5 hover:border-zinc-400 hover:shadow-[0_10px_18px_rgba(17,17,17,0.08)]"
        >
          <p>
            <strong>{idx + 1}. </strong>
            {story.story}
          </p>
          <p className="text-zinc-500">Priority: {story.priority}</p>
          <ul>
            {story.acceptanceCriteria.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </article>
  );
}
