import z from "zod";

export const AddToCartDTO = z.object({
  productId: z.string().min(1),
  qty: z.number().int().min(1).max(99).default(1),
});

export const UpdateCartItemDTO = z.object({
  qty: z.number().int().min(1).max(99),
});
