export type StoryDraft = {
  story: string;
  acceptanceCriteria: string[];
  priority: "high" | "medium" | "low";
  order: number;
};

export type TaskDraft = {
  title: string;
  description: string;
  group: "frontend" | "backend" | "qa" | "devops" | "product" | "unknown";
  status: "todo" | "in_progress" | "done";
  estimate?: string;
  priority: "high" | "medium" | "low";
  order: number;
};

export type GeneratedPayload = {
  userStories: StoryDraft[];
  tasks: TaskDraft[];
  generatedMarkdown: string;
};

type BuildMarkdownInput = {
  title: string;
  templateType: string;
  goal: string;
  users: string;
  constraints: string;
  riskUnknowns?: string;
  userStories: StoryDraft[];
  tasks: TaskDraft[];
};

export function buildMarkdown(input: BuildMarkdownInput): string {
  const storyLines = input.userStories
    .map((story, idx) => {
      const criteria = story.acceptanceCriteria.map((c) => `  - ${c}`).join("\n");
      return `${idx + 1}. ${story.story}\n${criteria}\n  - Priority: ${story.priority}`;
    })
    .join("\n\n");

  const taskLines = input.tasks
    .sort((a, b) => a.order - b.order)
    .map(
      (task, idx) =>
        `${idx + 1}. [${task.group}] ${task.title} (${task.status}, ${task.priority})${
          task.estimate ? ` - ${task.estimate}` : ""
        }\n   ${task.description}`
    )
    .join("\n\n");

  return [
    `# ${input.title}`,
    "",
    `Template: ${input.templateType}`,
    "",
    "## Goal",
    input.goal,
    "",
    "## Users",
    input.users,
    "",
    "## Constraints",
    input.constraints,
    "",
    "## Risks / Unknowns",
    input.riskUnknowns || "None provided.",
    "",
    "## User Stories",
    storyLines,
    "",
    "## Engineering Tasks",
    taskLines
  ].join("\n");
}

export function markdownToText(markdown: string): string {
  return markdown
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*-\s*/gm, "- ")
    .replace(/^\s*\d+\.\s*/gm, "- ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
