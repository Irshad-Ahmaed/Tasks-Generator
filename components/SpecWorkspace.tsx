"use client";

import { DragEvent, useMemo, useState } from "react";
import { ApiSpec } from "@/lib/types";

type Props = {
  initialSpec: ApiSpec;
};

const selectClasses =
  "w-full cursor-pointer rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm transition hover:border-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-4 focus:ring-zinc-400/20";

function getTaskCardClasses(task: ApiSpec["tasks"][number], isDragging: boolean): string {
  let classes =
    "rounded-xl border p-3 transition hover:-translate-y-0.5 hover:shadow-[0_10px_18px_rgba(17,17,17,0.08)]";

  if (task.status === "done") {
    classes += " border-emerald-300 bg-emerald-50";
  } else if (task.status === "todo") {
    if (task.priority === "high") {
      classes += " border-red-300 bg-red-50";
    } else if (task.priority === "medium") {
      classes += " border-amber-300 bg-amber-50";
    } else {
      classes += " border-zinc-300 bg-zinc-100";
    }
  } else {
    classes += " border-zinc-300 bg-white";
  }

  classes += " cursor-grab";

  if (isDragging) {
    classes += " cursor-grabbing opacity-75";
  }

  return classes;
}

function getPriorityBadgeClasses(priority: ApiSpec["tasks"][number]["priority"]): string {
  if (priority === "high") {
    return "rounded-full border border-red-300 bg-red-100 px-2.5 py-1 text-xs font-semibold capitalize text-red-900";
  }

  if (priority === "medium") {
    return "rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs font-semibold capitalize text-amber-900";
  }

  return "rounded-full border border-zinc-300 bg-zinc-100 px-2.5 py-1 text-xs font-semibold capitalize text-zinc-700";
}

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
        <article className="rounded-2xl border border-zinc-300 bg-white p-5 shadow-[0_16px_30px_rgba(17,17,17,0.08)]">
          <h2 className="mb-2.5 text-xl font-semibold">User Stories</h2>
          {spec.userStories.map((story, idx) => (
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

        <aside className="rounded-2xl border border-zinc-300 bg-white p-5 shadow-[0_16px_30px_rgba(17,17,17,0.08)]">
          <h2 className="mb-2.5 text-xl font-semibold">Brief</h2>
          <p>
            <strong>Goal:</strong> {spec.goal}
          </p>
          <p>
            <strong>Users:</strong> {spec.users}
          </p>
          <p>
            <strong>Constraints:</strong> {spec.constraints}
          </p>
          <p>
            <strong>Risks/Unknowns:</strong> {spec.riskUnknowns || "Not provided."}
          </p>
          {message && <p className="text-zinc-500">{message}</p>}
          {saving && <p className="text-zinc-500">Saving task order...</p>}
        </aside>
      </div>

      <article className="rounded-2xl border border-zinc-300 bg-white p-5 shadow-[0_16px_30px_rgba(17,17,17,0.08)]">
        <h2 className="mb-2.5 text-xl font-semibold">Engineering Tasks</h2>
        <p className="mt-0 text-zinc-500">Drag and drop a task card to reorder it inside the same section.</p>
        {[...groupedTasks.entries()].map(([groupName, tasks]) => (
          <section key={groupName} className="mb-4">
            <h3 className="capitalize">{groupName}</h3>
            <div className="flex flex-wrap gap-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`${getTaskCardClasses(task, draggedTaskId === task.id)} mb-0 basis-82.5`}
                  draggable
                  onDragStart={(event) => onTaskDragStart(event, task.id)}
                  onDragOver={onTaskDragOver}
                  onDrop={(event) => onTaskDrop(event, task.id, groupName as ApiSpec["tasks"][number]["group"])}
                  onDragEnd={() => setDraggedTaskId(null)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <strong>{task.title}</strong>
                    <span className={getPriorityBadgeClasses(task.priority)}>{task.priority}</span>
                  </div>

                  <p className="mt-1.5 text-zinc-500">{task.description}</p>

                  <div className="mt-2 grid gap-2">
                    <select
                      value={task.group}
                      onChange={(event) =>
                        updateTask(task.id, { group: event.target.value as ApiSpec["tasks"][number]["group"] })
                      }
                      className={selectClasses}
                    >
                      <option value="frontend">frontend</option>
                      <option value="backend">backend</option>
                      <option value="qa">qa</option>
                      <option value="devops">devops</option>
                      <option value="product">product</option>
                      <option value="unknown">unknown</option>
                    </select>

                    <select
                      value={task.status}
                      onChange={(event) =>
                        updateTask(task.id, { status: event.target.value as ApiSpec["tasks"][number]["status"] })
                      }
                      className={selectClasses}
                    >
                      <option value="todo">todo</option>
                      <option value="in_progress">in_progress</option>
                      <option value="done">done</option>
                    </select>

                    <select
                      value={task.priority}
                      onChange={(event) =>
                        updateTask(task.id, { priority: event.target.value as ApiSpec["tasks"][number]["priority"] })
                      }
                      className={selectClasses}
                    >
                      <option value="high">high</option>
                      <option value="medium">medium</option>
                      <option value="low">low</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </article>
    </section>
  );
}
