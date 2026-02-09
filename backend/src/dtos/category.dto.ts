import z from "zod";

export const AdminCreateCategoryDTO = z.object({
  name: z.string().min(2),
  parentId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const AdminUpdateCategoryDTO = z.object({
  name: z.string().min(2).optional(),
  parentId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});
