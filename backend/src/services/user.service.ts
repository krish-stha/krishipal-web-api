import { CreateUserDTO, LoginUserDTO } from "../dtos/user.dto";
import { UserRepository } from "../repositories/user.repository";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { HttpError } from "../errors/http-error";

const userRepository = new UserRepository();

export class UserService {

  async register(data: CreateUserDTO) {
    const emailExists = await userRepository.getByEmail(data.email);
    if (emailExists) {
      throw new HttpError(409, "Email already registered");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await userRepository.create({
      fullName: data.fullName,
      email: data.email,
      countryCode:data.countryCode,
      phone: data.phone,
      address: data.address,
      password: hashedPassword,
      role: "user",
    });

    return user;
  }

  async login(data: LoginUserDTO) {
    const user = await userRepository.getByEmail(data.email);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) {
      throw new HttpError(401, "Invalid credentials");
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    return { user, token };
  }
}