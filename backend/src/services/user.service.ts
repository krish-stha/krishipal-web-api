import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { HttpError } from "../errors/http-error";
import { UserRepository } from "../repositories/user.repository";
import { CreateUserDTO, LoginUserDTO, UpdateUserDTO } from "../dtos/user.dto";

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

  // ✅ ADD THIS BACK (for POST /upload-profile-picture)
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
}
