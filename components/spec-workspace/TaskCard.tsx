"use client";

import { DragEvent } from "react";
import { ApiSpec } from "@/lib/types";

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

type Props = {
  task: ApiSpec["tasks"][number];
  isDragging: boolean;
  onDragStart: (event: DragEvent<HTMLDivElement>, taskId: string) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>, targetTaskId: string, groupName: ApiSpec["tasks"][number]["group"]) => void;
  onDragEnd: () => void;
  onUpdateTask: (
    taskId: string,
    patch: Partial<Pick<ApiSpec["tasks"][number], "title" | "description" | "group" | "status" | "priority">>
  ) => void;
};

export function TaskCard({ task, isDragging, onDragStart, onDragOver, onDrop, onDragEnd, onUpdateTask }: Props) {
  return (
    <div
      className={`${getTaskCardClasses(task, isDragging)} mb-0 basis-82.5`}
      draggable
      onDragStart={(event) => onDragStart(event, task.id)}
      onDragOver={onDragOver}
      onDrop={(event) => onDrop(event, task.id, task.group)}
      onDragEnd={onDragEnd}
    >
      <div className="flex items-center justify-between gap-2">
        <strong>{task.title}</strong>
        <span className={getPriorityBadgeClasses(task.priority)}>{task.priority}</span>
      </div>

      <p className="mt-1.5 text-zinc-500">{task.description}</p>

      <div className="mt-2 grid gap-2">
        <select
          value={task.group}
          onChange={(event) => onUpdateTask(task.id, { group: event.target.value as ApiSpec["tasks"][number]["group"] })}
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
            onUpdateTask(task.id, { status: event.target.value as ApiSpec["tasks"][number]["status"] })
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
            onUpdateTask(task.id, { priority: event.target.value as ApiSpec["tasks"][number]["priority"] })
          }
          className={selectClasses}
        >
          <option value="high">high</option>
          <option value="medium">medium</option>
          <option value="low">low</option>
        </select>
      </div>
    </div>
  );
}
