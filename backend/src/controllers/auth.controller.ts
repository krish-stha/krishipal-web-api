import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { CreateUserDTO, LoginUserDTO } from "../dtos/user.dto";
import z from "zod";

const userService = new UserService();

export class AuthController {

  async register(req: Request, res: Response) {
    const parsed = CreateUserDTO.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        errors: z.prettifyError(parsed.error),
      });
    }

    const user = await userService.register(parsed.data);
    res.status(201).json({ success: true, data: user });
  }

  async login(req: Request, res: Response) {
    const parsed = LoginUserDTO.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        errors: z.prettifyError(parsed.error),
      });
    }

    const result = await userService.login(parsed.data);
    res.status(200).json({ success: true, ...result });
  }
}
