import z from "zod";
import { UserSchema } from "../types/user.type";

/* REGISTER DTO */
export const CreateUserDTO = UserSchema.extend({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email"),
  countryCode: z.string(),
  phone: z.string().min(10, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
}).passthrough(); // ignore any extra fields like confirmPassword

export type CreateUserDTO = z.infer<typeof CreateUserDTO>;

/* LOGIN DTO */
export const LoginUserDTO = z.object({
  email: z.string(),
  password: z.string().min(6),
});

export type LoginUserDTO = z.infer<typeof LoginUserDTO>;
