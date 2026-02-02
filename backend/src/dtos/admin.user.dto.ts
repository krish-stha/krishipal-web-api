import z from "zod";

export const AdminCreateUserDTO = z
  .object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email"),
    countryCode: z.string().min(1, "Country code is required"),
    phone: z.string().min(6, "Phone is required"),
    address: z.string().min(3, "Address is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["user", "admin"]).optional()
  })
  .passthrough();

export type AdminCreateUserDTO = z.infer<typeof AdminCreateUserDTO>;

export const AdminUpdateUserDTO = z
  .object({
    fullName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    countryCode: z.string().optional(),
    phone: z.string().min(6).optional(),
    address: z.string().min(3).optional(),
    password: z.string().min(6).optional(),
    role: z.enum(["user", "admin"]).optional(),
    deleted_at: z.coerce.date().nullable().optional()
  })
  .passthrough();

export type AdminUpdateUserDTO = z.infer<typeof AdminUpdateUserDTO>;
