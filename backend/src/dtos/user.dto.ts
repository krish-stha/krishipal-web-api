import z from "zod";
import { UserSchema } from "../types/user.type";

/* REGISTER */
export const CreateUserDTO = UserSchema.extend({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email"),
  countryCode: z.string(),
  phone: z.string().min(6, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  profile_picture: z.string().nullable().optional(),
  deleted_at: z.date().nullable().optional()
}).passthrough();

export type CreateUserDTO = z.infer<typeof CreateUserDTO>;

/* LOGIN */
export const LoginUserDTO = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});
export type LoginUserDTO = z.infer<typeof LoginUserDTO>;

/* UPDATE (PUT /api/auth/:id) */
export const UpdateUserDTO = z
  .object({
    fullName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    countryCode: z.string().optional(),
    phone: z.string().min(6).optional(),
    address: z.string().min(3).optional(),
    password: z.string().min(6).optional()
  })
  .passthrough();

export type UpdateUserDTO = z.infer<typeof UpdateUserDTO>;
