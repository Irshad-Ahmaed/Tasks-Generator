import { z } from "zod";

export const featureFormSchema = z.object({
  title: z.string().trim().min(3).max(120),
  templateType: z.enum(["web_app", "mobile_app", "internal_tool"]),
  goal: z.string().trim().min(10).max(500),
  users: z.string().trim().min(5).max(300),
  constraints: z.string().trim().min(5).max(500),
  riskUnknowns: z.string().trim().max(500).optional().or(z.literal(""))
});

export const taskUpdateSchema = z
  .object({
    title: z.string().trim().min(3).max(160).optional(),
    description: z.string().trim().min(3).max(1000).optional(),
    group: z.enum(["frontend", "backend", "qa", "devops", "product", "unknown"]).optional(),
    status: z.enum(["todo", "in_progress", "done"]).optional(),
    estimate: z.string().trim().max(40).optional(),
    priority: z.enum(["high", "medium", "low"]).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be updated."
  });

export const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      order: z.number().int().nonnegative(),
      group: z.enum(["frontend", "backend", "qa", "devops", "product", "unknown"]),
      status: z.enum(["todo", "in_progress", "done"])
    })
  )
});
