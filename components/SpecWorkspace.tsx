"use client";

import { DragEvent, useMemo, useState } from "react";
import { ApiSpec } from "@/lib/types";

type Props = {
  initialSpec: ApiSpec;
};

export function SpecWorkspace({ initialSpec }: Props) {
  const [spec, setSpec] = useState<ApiSpec>(initialSpec);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

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

    // Keep other groups in place; only rewrite slots for this section.
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

    // Keep export friction low: copy to clipboard and also trigger a file download.
    await navigator.clipboard.writeText(data.content);
    const blob = new Blob([data.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = data.filename;
    anchor.click();
    URL.revokeObjectURL(url);

    setMessage(`${format === "markdown" ? "Markdown" : "Text"} copied and downloaded.`);
  }

  return (
    <section className="grid" style={{ gap: 20, paddingTop: 20, paddingBottom: 30 }}>
      <div className="panel">
        <div className="space">
          <div>
            <h1 className="hero-title" style={{ margin: 0, fontSize: "1.7rem" }}>{spec.title}</h1>
            <p className="muted" style={{ marginTop: 8 }}>
              Template: {spec.templateType}
            </p>
          </div>

          <div className="row">
            <button className="secondary" onClick={() => exportContent("markdown")}>Copy + Download .md</button>
            <button className="ghost" onClick={() => exportContent("text")}>Copy + Download .txt</button>
          </div>
        </div>
      </div>

      <div className="grid two">
        <article className="panel">
          <h2 className="section-title">User Stories</h2>
          {spec.userStories.map((story, idx) => (
            <div key={story.id} className="task-row">
              <p>
                <strong>{idx + 1}. </strong>
                {story.story}
              </p>
              <p className="muted">Priority: {story.priority}</p>
              <ul>
                {story.acceptanceCriteria.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </article>

        <aside className="panel">
          <h2 className="section-title">Brief</h2>
          <p><strong>Goal:</strong> {spec.goal}</p>
          <p><strong>Users:</strong> {spec.users}</p>
          <p><strong>Constraints:</strong> {spec.constraints}</p>
          <p><strong>Risks/Unknowns:</strong> {spec.riskUnknowns || "Not provided."}</p>
          {message && <p className="muted">{message}</p>}
          {saving && <p className="muted">Saving task order...</p>}
        </aside>
      </div>

      <article className="panel">
        <h2 className="section-title">Engineering Tasks</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Drag and drop a task card to reorder it inside the same section.
        </p>
        {[...groupedTasks.entries()].map(([groupName, tasks]) => (
          <section key={groupName} style={{ marginBottom: 16 }}>
            <h3 style={{ textTransform: "capitalize" }}>{groupName}</h3>
            <div className="task-grid">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`task-row draggable-task${task.status === "todo" ? " task-todo task-priority-" + task.priority : ""}${task.status === "done" ? " task-done" : ""}${draggedTaskId === task.id ? " dragging" : ""}`}
                  draggable
                  onDragStart={(event) => onTaskDragStart(event, task.id)}
                  onDragOver={onTaskDragOver}
                  onDrop={(event) =>
                    onTaskDrop(
                      event,
                      task.id,
                      groupName as ApiSpec["tasks"][number]["group"]
                    )
                  }
                  onDragEnd={() => setDraggedTaskId(null)}
                >
                  <div className="space">
                    <strong>{task.title}</strong>
                    <span className={`badge priority-${task.priority}`}>{task.priority}</span>
                  </div>

                  <p className="muted" style={{ marginTop: 6 }}>
                    {task.description}
                  </p>

                  <div className="task-controls">
                    <select
                      value={task.group}
                      onChange={(event) => updateTask(task.id, { group: event.target.value as ApiSpec["tasks"][number]["group"] })}
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
                      onChange={(event) => updateTask(task.id, { status: event.target.value as ApiSpec["tasks"][number]["status"] })}
                    >
                      <option value="todo">todo</option>
                      <option value="in_progress">in_progress</option>
                      <option value="done">done</option>
                    </select>

                    <select
                      value={task.priority}
                      onChange={(event) => updateTask(task.id, { priority: event.target.value as ApiSpec["tasks"][number]["priority"] })}
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
