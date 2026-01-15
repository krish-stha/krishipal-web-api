import z from "zod";

export const UserSchema = z.object({
  fullName: z.string().min(2),
  email: z.string(),
  countryCode: z.string(),
  phone: z.string().min(7),
  address: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(["user", "admin"]).default("user"),

  // ✅ optional & nullable fields in Zod
  profile_picture: z.string().nullable().optional(),
  deleted_at: z.date().nullable().optional()
});

export type UserType = z.infer<typeof UserSchema>;
