import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { CreateUserDTO, LoginUserDTO } from "../dtos/user.dto";
import z from "zod";
import { AuthRequest } from "../middleware/auth.middleware";

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

  // GET /api/auth/me
  async me(req: AuthRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await userService.getMe(userId);
    res.status(200).json({ success: true, data: user });
  }

  // POST /api/auth/upload-profile-picture
  async uploadProfilePicture(req: AuthRequest, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // multer attaches file here
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      return res.status(400).json({ success: false, message: "Please upload a photo file" });
    }

    const updatedUser = await userService.setProfilePicture(userId, file.filename);

    res.status(200).json({
      success: true,
      data: {
        filename: file.filename,
        user: updatedUser,
      },
      message: "Profile picture uploaded successfully",
    });
  }

    // PUT /api/auth/:id (multer) - update user profile
    // PUT /api/auth/:id  (update own profile, admin can update anyone)
  async updateProfile(req: AuthRequest, res: Response) {
    const loggedUser = req.user;
    if (!loggedUser) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const paramId = req.params.id;

    // only self OR admin
    if (loggedUser.id !== paramId && loggedUser.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const file = (req as any).file as Express.Multer.File | undefined;
    const profileFilename = file?.filename ?? null;

    const updated = await userService.updateProfileById(paramId, req.body, profileFilename);

    return res.status(200).json({ success: true, data: updated, message: "Profile updated" });
  }


}
