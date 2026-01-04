import { UserModel, IUser } from "../models/user.model";
import { CreateUserDTO } from "../dtos/user.dto";

export class UserRepository {
  async getByEmail(email: string): Promise<IUser | null> {
    return UserModel.findOne({ email }).exec();
  }

  async create(userData: Omit<CreateUserDTO, "confirmPassword">): Promise<IUser> {
    const user = new UserModel(userData);
    return await user.save(); // Add await
  }
}
