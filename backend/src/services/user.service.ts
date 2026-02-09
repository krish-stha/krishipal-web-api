import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { JWT_SECRET } from "../config";
import { HttpError } from "../errors/http-error";
import { UserRepository } from "../repositories/user.repository";
import { CreateUserDTO, LoginUserDTO, UpdateUserDTO } from "../dtos/user.dto";
import { UserModel } from "../models/user.model";
import { sendResetEmail } from "./mail.service";

const userRepo = new UserRepository();

export class UserService {
  async register(data: CreateUserDTO) {
    const exists = await userRepo.getByEmail(data.email);
    if (exists) throw new HttpError(409, "Email already registered");

    const hashed = await bcrypt.hash(data.password, 10);

    return userRepo.create({
      fullName: data.fullName,
      email: data.email,
      countryCode: data.countryCode,
      phone: data.phone,
      address: data.address,
      password: hashed,
      role: "user",
      profile_picture: null,
      deleted_at: null,
    });
  }

  async login(data: LoginUserDTO) {
    const user = await userRepo.getByEmail(data.email);
    if (!user) throw new HttpError(404, "User not found");

    const ok = await bcrypt.compare(data.password, user.password);
    if (!ok) throw new HttpError(401, "Invalid credentials");

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    // remove password in response
    const safeUser = await userRepo.getById(String(user._id));
    return { user: safeUser, token };
  }

  async getMe(userId: string) {
    const user = await userRepo.getById(userId);
    if (!user) throw new HttpError(404, "User not found");
    return user;
  }

  async setProfilePicture(userId: string, filename: string) {
    const updated = await userRepo.updateProfilePicture(userId, filename);
    if (!updated) throw new HttpError(404, "User not found");
    return updated;
  }

  async updateProfileById(
    userId: string,
    data: Partial<UpdateUserDTO>,
    profileFilename?: string | null
  ) {
    const payload: any = { ...data };

    if (profileFilename) payload.profile_picture = profileFilename;

    if (data.password) payload.password = await bcrypt.hash(data.password, 10);

    if (data.email) {
      const exists = await userRepo.getByEmail(data.email);
      if (exists && String(exists._id) !== userId) {
        throw new HttpError(409, "Email already registered");
      }
    }

    const updated = await userRepo.updateById(userId, payload);
    if (!updated) throw new HttpError(404, "User not found");
    return updated;
  }

  // ✅ NEW: Forgot password
  // - Always returns success (even if email not found) to avoid user enumeration
  // - Stores token + expiry in DB
  async forgotPassword(email: string) {
  const user = await UserModel.findOne({
    email: email.toLowerCase(),
    deleted_at: null,
  });

  if (!user) {
    return { message: "If your email exists, a reset link has been sent." };
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  user.reset_password_token = tokenHash;
  user.reset_password_expires_at = new Date(Date.now() + 1000 * 60 * 15);
  await user.save();

  const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${rawToken}`;

  await sendResetEmail(user.email, resetLink);

  return { message: "Reset email sent successfully." };
}

  // ✅ NEW: Reset password
  async resetPassword(token: string, newPassword: string) {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await UserModel.findOne({
      reset_password_token: tokenHash,
      reset_password_expires_at: { $gt: new Date() },
      deleted_at: null,
    });

    if (!user) throw new HttpError(400, "Invalid or expired reset token");

    user.password = await bcrypt.hash(newPassword, 10);
    user.reset_password_token = null;
    user.reset_password_expires_at = null;
    await user.save();

    return { message: "Password reset successful" };
  }
}
