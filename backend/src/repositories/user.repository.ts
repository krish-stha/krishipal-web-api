import { UserModel } from "../models/user.model";
import { UserType } from "../types/user.type";

export class UserRepository {
  async create(data: Partial<UserType>) {
    const created = await UserModel.create(data);
    return UserModel.findById(created._id).select("-password");
  }

  async getByEmail(email: string) {
    return UserModel.findOne({ email }); // keep password for login
  }

  async getById(id: string) {
    return UserModel.findById(id).select("-password");
  }

  async getByIdWithPassword(id: string) {
    return UserModel.findById(id); // includes password
  }

  // ✅ ADD THIS BACK
  async updateProfilePicture(id: string, filename: string) {
    return UserModel.findByIdAndUpdate(
      id,
      { profile_picture: filename },
      { new: true }
    ).select("-password");
  }

  async listAll() {
    return UserModel.find({ deleted_at: null }).select("-password").sort({ createdAt: -1 });
  }

  async updateById(id: string, data: any) {
    return UserModel.findByIdAndUpdate(id, data, { new: true }).select("-password");
  }

  async hardDeleteById(id: string) {
    return UserModel.findByIdAndDelete(id).select("-password");
  }

  // repositories/user.repository.ts
async softDeleteById(id: string) {
  return UserModel.findByIdAndUpdate(
    id,
    { deleted_at: new Date() },
    { new: true }
  ).select("-password");
}

}
