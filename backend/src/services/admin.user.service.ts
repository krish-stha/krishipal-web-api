import bcrypt from "bcryptjs";
import { HttpError } from "../errors/http-error";
import { UserRepository } from "../repositories/user.repository";
import { AdminCreateUserDTO, AdminUpdateUserDTO } from "../dtos/admin.user.dto";
import { UserModel } from "../models/user.model";

const userRepo = new UserRepository();

export class AdminUserService {
  async createUser(data: AdminCreateUserDTO, profileFilename?: string | null) {
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
      role: data.role ?? "user",
      profile_picture: profileFilename ?? null,
      deleted_at: null
    });
  }

async getUsers() {
  return UserModel.find({ deleted_at: null })
    .sort({ createdAt: -1 })
    .select("-password")
    .lean();
}


  async getUserById(id: string) {
    const user = await userRepo.getById(id);
    if (!user) throw new HttpError(404, "User not found");
    return user;
  }

  async updateUser(id: string, data: AdminUpdateUserDTO, profileFilename?: string | null) {
    const payload: any = { ...data };

    if (profileFilename) payload.profile_picture = profileFilename;

    if (data.password) payload.password = await bcrypt.hash(data.password, 10);

    if (data.email) {
      const exists = await userRepo.getByEmail(data.email);
      if (exists && String(exists._id) !== id) throw new HttpError(409, "Email already registered");
    }

    const updated = await userRepo.updateById(id, payload);
    if (!updated) throw new HttpError(404, "User not found");
    return updated;
  }

  // admin.user.service.ts
async softDeleteUser(id: string) {
  const updated = await userRepo.softDeleteById(id);
  if (!updated) throw new HttpError(404, "User not found");
  return updated;
}

async hardDeleteUser(id: string) {
  const deleted = await userRepo.hardDeleteById(id);
  if (!deleted) throw new HttpError(404, "User not found");
  return deleted;
}

async getUsersPaginated(page: number, limit: number) {
    const filter = { deleted_at: null };

    const skip = (page - 1) * limit;

    const [total, users] = await Promise.all([
      UserModel.countDocuments(filter),
      UserModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-password") // ✅ never send password to frontend
        .lean(),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }
}
