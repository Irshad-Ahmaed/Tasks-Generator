export type ApiSpec = {
  id: string;
  title: string;
  templateType: string;
  goal: string;
  users: string;
  constraints: string;
  riskUnknowns: string | null;
  generatedMarkdown: string;
  createdAt: string;
  updatedAt: string;
  userStories: Array<{
    id: string;
    story: string;
    acceptanceCriteria: string[];
    priority: "high" | "medium" | "low";
    order: number;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    group: "frontend" | "backend" | "qa" | "devops" | "product" | "unknown";
    status: "todo" | "in_progress" | "done";
    estimate: string | null;
    priority: "high" | "medium" | "low";
    order: number;
  }>;
};
