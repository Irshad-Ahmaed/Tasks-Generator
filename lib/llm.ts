import { buildMarkdown, GeneratedPayload, StoryDraft, TaskDraft } from "@/lib/exporters";

type GenerateInput = {
  title: string;
  templateType: "web_app" | "mobile_app" | "internal_tool";
  goal: string;
  users: string;
  constraints: string;
  riskUnknowns?: string;
};

type LlmUsage = {
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
};

type GenerationMeta = {
  model: string;
  usedFallback: boolean;
  usage: LlmUsage;
  estimatedCostUsd: number | null;
};

export type GenerationResult = GeneratedPayload & {
  meta: GenerationMeta;
};

const generationSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    userStories: {
      type: "array",
      minItems: 4,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          story: { type: "string" },
          acceptanceCriteria: {
            type: "array",
            minItems: 2,
            maxItems: 5,
            items: { type: "string" }
          },
          priority: { type: "string", enum: ["high", "medium", "low"] }
        },
        required: ["story", "acceptanceCriteria", "priority"]
      }
    },
    tasks: {
      type: "array",
      minItems: 8,
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          group: {
            type: "string",
            enum: ["frontend", "backend", "qa", "devops", "product", "unknown"]
          },
          status: { type: "string", enum: ["todo", "in_progress", "done"] },
          estimate: { type: "string" },
          priority: { type: "string", enum: ["high", "medium", "low"] }
        },
        required: ["title", "description", "group", "status", "priority"]
      }
    }
  },
  required: ["userStories", "tasks"]
};

function getBaseUrl(): string {
  return (
    process.env.GEMINI_BASE_URL?.trim() ||
    "https://generativelanguage.googleapis.com/v1beta/openai/"
  )
    .replace(/\/+$/, "/");
}

async function callChatCompletions(args: {
  apiKey: string;
  model: string;
  messages: Array<{ role: "system" | "user"; content: string }>;
}): Promise<{ content: string; usage: LlmUsage }> {
  const response = await fetch(`${getBaseUrl()}chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: args.model,
      messages: args.messages,
      temperature: 0.2,
      max_tokens: 1800
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`LLM HTTP ${response.status}: ${errorText || "No error body returned."}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("LLM returned an empty message.");
  }

  return {
    content,
    usage: {
      promptTokens: data.usage?.prompt_tokens ?? null,
      completionTokens: data.usage?.completion_tokens ?? null,
      totalTokens: data.usage?.total_tokens ?? null
    }
  };
}

function estimateCostUsd(model: string, usage: LlmUsage): number | null {
  if (usage.promptTokens === null && usage.completionTokens === null) {
    return null;
  }

  // Approximate default pricing for Gemini 2.5 Flash Lite in USD per 1M tokens.
  // Override via env for provider/model changes.
  const defaultInputPerMillion = model.includes("flash-lite") ? 0.1 : 0.3;
  const defaultOutputPerMillion = model.includes("flash-lite") ? 0.4 : 1;

  const inputPerMillion = Number(process.env.GEMINI_INPUT_USD_PER_MILLION || defaultInputPerMillion);
  const outputPerMillion = Number(process.env.GEMINI_OUTPUT_USD_PER_MILLION || defaultOutputPerMillion);

  const inputTokens = usage.promptTokens ?? 0;
  const outputTokens = usage.completionTokens ?? 0;
  const cost = (inputTokens / 1_000_000) * inputPerMillion + (outputTokens / 1_000_000) * outputPerMillion;

  return Number(cost.toFixed(8));
}

function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const fencedMatch = trimmed.match(/```json\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

function normalize(payload: { userStories: StoryDraft[]; tasks: TaskDraft[] }, input: GenerateInput): GeneratedPayload {
  const userStories = payload.userStories.slice(0, 8).map((story, idx) => ({
    story: story.story.trim(),
    acceptanceCriteria: story.acceptanceCriteria.map((item) => item.trim()).filter(Boolean).slice(0, 5),
    priority: story.priority,
    order: idx
  }));

  const uniqueTaskTitles = new Set<string>();
  const tasks = payload.tasks
    .filter((task) => {
      const key = task.title.toLowerCase().trim();
      if (!key || uniqueTaskTitles.has(key)) {
        return false;
      }
      uniqueTaskTitles.add(key);
      return true;
    })
    .slice(0, 20)
    .map((task, idx) => ({
      title: task.title.trim(),
      description: task.description.trim(),
      group: task.group,
      status: task.status,
      estimate: task.estimate?.trim(),
      priority: task.priority,
      order: idx
    }));

  const generatedMarkdown = buildMarkdown({
    ...input,
    userStories,
    tasks
  });

  return { userStories, tasks, generatedMarkdown };
}

function buildFallback(input: GenerateInput): GeneratedPayload {
  const userStories: StoryDraft[] = [
    {
      story: `As a product planner, I want to capture a feature brief so I can generate a concrete delivery plan for ${input.goal.toLowerCase()}.`,
      acceptanceCriteria: [
        "Form captures goal, users, and constraints",
        "Validation blocks empty submissions"
      ],
      priority: "high",
      order: 0
    },
    {
      story: "As an engineer, I want generated user stories so implementation can start faster.",
      acceptanceCriteria: ["Stories follow a predictable format", "Each story has acceptance criteria"],
      priority: "high",
      order: 1
    },
    {
      story: "As a team lead, I want grouped engineering tasks so responsibilities are clear.",
      acceptanceCriteria: ["Tasks include a group label", "Tasks are reorderable"],
      priority: "medium",
      order: 2
    },
    {
      story: "As a PM, I want export options so I can share plans quickly.",
      acceptanceCriteria: ["Markdown export works", "Plain text export works"],
      priority: "medium",
      order: 3
    }
  ];

  const tasks: TaskDraft[] = [
    { title: "Build feature brief form", description: "Create fields for goal, users, constraints, and template.", group: "frontend", status: "todo", priority: "high", order: 0 },
    { title: "Add form validation", description: "Use schema validation for required and length-limited fields.", group: "backend", status: "todo", priority: "high", order: 1 },
    { title: "Implement generation API", description: "Call LLM and normalize response into stories and tasks.", group: "backend", status: "todo", priority: "high", order: 2 },
    { title: "Create spec workspace view", description: "Show stories and editable grouped tasks.", group: "frontend", status: "todo", priority: "high", order: 3 },
    { title: "Add task edit endpoint", description: "Allow title, description, group, status, and priority updates.", group: "backend", status: "todo", priority: "medium", order: 4 },
    { title: "Implement reorder endpoint", description: "Persist new order and grouping updates.", group: "backend", status: "todo", priority: "medium", order: 5 },
    { title: "Add export actions", description: "Support copy markdown and plain text download.", group: "frontend", status: "todo", priority: "medium", order: 6 },
    { title: "Build status page", description: "Check backend, database, and LLM connection states.", group: "frontend", status: "todo", priority: "medium", order: 7 },
    { title: "Add run history", description: "Show last five generated specs on home page.", group: "frontend", status: "todo", priority: "medium", order: 8 },
    { title: "Document setup", description: "Write README, AI notes, and prompt log.", group: "product", status: "todo", priority: "low", order: 9 }
  ];

  return {
    userStories,
    tasks,
    generatedMarkdown: buildMarkdown({ ...input, userStories, tasks })
  };
}

export async function generateSpecFromLLM(input: GenerateInput): Promise<GenerationResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

  if (!apiKey) {
    return {
      ...buildFallback(input),
      meta: {
        model,
        usedFallback: true,
        usage: { promptTokens: null, completionTokens: null, totalTokens: null },
        estimatedCostUsd: null
      }
    };
  }

  const prompt = [
    `Title: ${input.title}`,
    `Template: ${input.templateType}`,
    `Goal: ${input.goal}`,
    `Users: ${input.users}`,
    `Constraints: ${input.constraints}`,
    `Risks/Unknowns: ${input.riskUnknowns || "None"}`
  ].join("\n");

  try {
    const llmResponse = await callChatCompletions({
      apiKey,
      model,
      messages: [
        {
          role: "system",
          content:
            "Return only valid JSON. Do not include markdown, explanations, or extra keys."
        },
        {
          role: "user",
          content: [
            "Create a planning output for this feature brief.",
            "",
            prompt,
            "",
            "Use this exact JSON shape:",
            JSON.stringify(generationSchema)
          ].join("\n")
        }
      ]
    });

    const parsed = JSON.parse(extractJsonObject(llmResponse.content)) as {
      userStories: StoryDraft[];
      tasks: TaskDraft[];
    };
    const normalized = normalize(parsed, input);
    const estimatedCostUsd = estimateCostUsd(model, llmResponse.usage);

    // Guarantee minimum data even if model barely satisfies schema.
    if (normalized.userStories.length < 4 || normalized.tasks.length < 8) {
      return {
        ...buildFallback(input),
        meta: {
          model,
          usedFallback: true,
          usage: llmResponse.usage,
          estimatedCostUsd
        }
      };
    }

    return {
      ...normalized,
      meta: {
        model,
        usedFallback: false,
        usage: llmResponse.usage,
        estimatedCostUsd
      }
    };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`LLM generation failed, using fallback tasks: ${message}`);
    }
    return {
      ...buildFallback(input),
      meta: {
        model,
        usedFallback: true,
        usage: { promptTokens: null, completionTokens: null, totalTokens: null },
        estimatedCostUsd: null
      }
    };
  }
}

export async function pingLLM(): Promise<"ok" | "degraded" | "missing_config"> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return "missing_config";
  }

  try {
    await callChatCompletions({
      apiKey,
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
      messages: [{ role: "user", content: "Reply with the word ok." }]
    });
    return "ok";
  } catch {
    return "degraded";
  }
}
