import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildMarkdown } from "@/lib/exporters";
import { generateSpecFromLLM } from "@/lib/llm";
import { featureFormSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = featureFormSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const startedAt = Date.now();

  try {
    const generated = await generateSpecFromLLM(input);
    // Use model markdown when available, otherwise build markdown here.
    const markdown =
      generated.generatedMarkdown ||
      buildMarkdown({
        ...input,
        userStories: generated.userStories,
        tasks: generated.tasks
      });

    // Save spec, stories, and tasks together.
    const created = await db.$transaction(async (tx) => {
      const spec = await tx.spec.create({
        data: {
          title: input.title,
          templateType: input.templateType,
          goal: input.goal,
          users: input.users,
          constraints: input.constraints,
          riskUnknowns: input.riskUnknowns || null,
          generatedMarkdown: markdown
        }
      });

      await tx.userStory.createMany({
        data: generated.userStories.map((story) => ({
          specId: spec.id,
          story: story.story,
          acceptanceCriteria: JSON.stringify(story.acceptanceCriteria),
          priority: story.priority,
          order: story.order
        }))
      });

      await tx.task.createMany({
        data: generated.tasks.map((task) => ({
          specId: spec.id,
          title: task.title,
          description: task.description,
          group: task.group,
          status: task.status,
          estimate: task.estimate || null,
          priority: task.priority,
          order: task.order
        }))
      });

      return spec;
    });

    await db.generationHistory.create({
      data: {
        specId: created.id,
        model: generated.meta.model,
        // Save response time so we can check slow requests later.
        latencyMs: Date.now() - startedAt,
        success: true,
        usedFallback: generated.meta.usedFallback,
        promptTokens: generated.meta.usage.promptTokens,
        completionTokens: generated.meta.usage.completionTokens,
        totalTokens: generated.meta.usage.totalTokens,
        estimatedCostUsd: generated.meta.estimatedCostUsd
      }
    });

    return NextResponse.json({
      specId: created.id
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown generation error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
