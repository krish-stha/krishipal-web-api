import z from "zod";

export const AdminUpdateBlogDTO = z.object({
  title: z.string().trim().min(3).optional(),
  slug: z.string().trim().min(3).optional(),
  excerpt: z.string().trim().max(300).optional(),
  content: z.string().trim().optional(),
  status: z.enum(["draft", "published"]).optional(),
});