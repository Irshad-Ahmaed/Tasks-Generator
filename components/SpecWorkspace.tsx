"use client";

import { DragEvent, useMemo, useState } from "react";
import { ApiSpec } from "@/lib/types";
import { UserStoriesPanel } from "@/components/spec-workspace/UserStoriesPanel";
import { BriefPanel } from "@/components/spec-workspace/BriefPanel";
import { TaskCard } from "@/components/spec-workspace/TaskCard";

type Props = {
  initialSpec: ApiSpec;
};

export function SpecWorkspace({ initialSpec }: Props) {
  const [spec, setSpec] = useState<ApiSpec>(initialSpec);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [exportingFormat, setExportingFormat] = useState<"markdown" | "text" | null>(null);

  const groupedTasks = useMemo(() => {
    const groups = new Map<string, ApiSpec["tasks"]>();

    for (const task of [...spec.tasks].sort((a, b) => a.order - b.order)) {
      const key = `${task.group}`;
      const current = groups.get(key) || [];
      current.push(task);
      groups.set(key, current);
    }

    return groups;
  }, [spec.tasks]);

  async function saveOrder(tasks: ApiSpec["tasks"]) {
    setSaving(true);
    setMessage(null);

    const items = tasks.map((task, index) => ({
      id: task.id,
      order: index,
      group: task.group,
      status: task.status
    }));

    const response = await fetch(`/api/specs/${spec.id}/tasks/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items })
    });

    if (!response.ok) {
      setMessage("Could not save task order. Refresh and retry.");
    } else {
      setMessage("Task order saved.");
    }

    setSaving(false);
  }

  async function reorderInsideGroup(
    sourceTaskId: string,
    targetTaskId: string,
    groupName: ApiSpec["tasks"][number]["group"]
  ) {
    if (sourceTaskId === targetTaskId) return;

    const ordered = [...spec.tasks].sort((a, b) => a.order - b.order);
    const grouped = ordered
      .map((task, index) => ({ task, index }))
      .filter((item) => item.task.group === groupName);

    const sourceIndex = grouped.findIndex((item) => item.task.id === sourceTaskId);
    const targetIndex = grouped.findIndex((item) => item.task.id === targetTaskId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const reorderedGroup = grouped.map((item) => item.task);
    const [moved] = reorderedGroup.splice(sourceIndex, 1);
    reorderedGroup.splice(targetIndex, 0, moved);

    const nextOrdered = [...ordered];
    grouped.forEach((item, idx) => {
      nextOrdered[item.index] = reorderedGroup[idx];
    });

    const updated = nextOrdered.map((task, idx) => ({ ...task, order: idx }));
    setSpec({ ...spec, tasks: updated });
    await saveOrder(updated);
  }

  function onTaskDragStart(event: DragEvent<HTMLDivElement>, taskId: string) {
    setDraggedTaskId(taskId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", taskId);
  }

  function onTaskDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  async function onTaskDrop(
    event: DragEvent<HTMLDivElement>,
    targetTaskId: string,
    groupName: ApiSpec["tasks"][number]["group"]
  ) {
    event.preventDefault();
    const sourceTaskId = draggedTaskId || event.dataTransfer.getData("text/plain");
    setDraggedTaskId(null);

    if (!sourceTaskId) return;
    await reorderInsideGroup(sourceTaskId, targetTaskId, groupName);
  }

  async function updateTask(
    taskId: string,
    patch: Partial<Pick<ApiSpec["tasks"][number], "title" | "description" | "group" | "status" | "priority">>
  ) {
    setMessage(null);

    const previous = spec.tasks;
    const optimistic = spec.tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task));
    setSpec({ ...spec, tasks: optimistic });

    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });

    if (!response.ok) {
      setSpec({ ...spec, tasks: previous });
      setMessage("Task update failed.");
      return;
    }

    if (patch.group || patch.status) {
      await saveOrder(optimistic);
    }
  }

  async function exportContent(format: "markdown" | "text") {
    setExportingFormat(format);
    try {
      const response = await fetch(`/api/specs/${spec.id}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format })
      });

      if (!response.ok) {
        setMessage("Export failed.");
        return;
      }

      const data = (await response.json()) as { content: string; filename: string };

      await navigator.clipboard.writeText(data.content);
      const blob = new Blob([data.content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = data.filename;
      anchor.click();
      URL.revokeObjectURL(url);

      setMessage(`${format === "markdown" ? "Markdown" : "Text"} copied and downloaded.`);
    } finally {
      setExportingFormat(null);
    }
  }

  return (
    <section className="grid gap-5 pb-8 pt-5">
      <div className="rounded-2xl border border-zinc-300 bg-white p-5 shadow-[0_16px_30px_rgba(17,17,17,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="m-0 text-[1.7rem] font-bold leading-tight">{spec.title}</h1>
            <p className="mt-2 text-zinc-500">Template: {spec.templateType}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              className="rounded-xl bg-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:-translate-y-0.5 hover:bg-zinc-300"
              onClick={() => exportContent("markdown")}
              disabled={exportingFormat !== null}
            >
              {exportingFormat === "markdown" ? "Exporting..." : "Copy + Download .md"}
            </button>
            <button
              className="rounded-xl border border-zinc-300 bg-transparent px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:-translate-y-0.5 hover:bg-zinc-100"
              onClick={() => exportContent("text")}
              disabled={exportingFormat !== null}
            >
              {exportingFormat === "text" ? "Exporting..." : "Copy + Download .txt"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <UserStoriesPanel userStories={spec.userStories} />
        <BriefPanel
          goal={spec.goal}
          users={spec.users}
          constraints={spec.constraints}
          riskUnknowns={spec.riskUnknowns}
          message={message}
          saving={saving}
        />
      </div>

      <article className="rounded-2xl border border-zinc-300 bg-white p-5 shadow-[0_16px_30px_rgba(17,17,17,0.08)]">
        <h2 className="mb-2.5 text-xl font-semibold">Engineering Tasks</h2>
        <p className="mt-0 text-zinc-500">Drag and drop a task card to reorder it inside the same section.</p>
        {[...groupedTasks.entries()].map(([groupName, tasks]) => (
          <section key={groupName} className="mb-4">
            <h3 className="capitalize">{groupName}</h3>
            <div className="flex flex-wrap gap-3">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isDragging={draggedTaskId === task.id}
                  onDragStart={onTaskDragStart}
                  onDragOver={onTaskDragOver}
                  onDrop={onTaskDrop}
                  onDragEnd={() => setDraggedTaskId(null)}
                  onUpdateTask={updateTask}
                />
              ))}
            </div>
          </section>
        ))}
      </article>
    </section>
  );
}
