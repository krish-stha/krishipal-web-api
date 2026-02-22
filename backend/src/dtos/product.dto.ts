import z from "zod";

export const AdminCreateProductDTO = z.object({
  name: z.string().min(2),
  sku: z.string().min(3),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  discountPrice: z.coerce.number().min(0).optional().nullable(),
  stock: z.coerce.number().int().min(0),
  categoryId: z.string().min(1),
  status: z.enum(["active", "draft"]).optional(),
});

export const AdminUpdateProductDTO = z.object({
  name: z.string().min(2).optional(),
  sku: z.string().min(3).optional(),
  description: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  discountPrice: z.coerce.number().min(0).optional().nullable(),
  stock: z.coerce.number().int().min(0).optional(),
  categoryId: z.string().optional(),
  status: z.enum(["active", "draft"]).optional(),
});
