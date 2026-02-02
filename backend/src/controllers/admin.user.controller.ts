import { Request, Response } from "express";
import z from "zod";
import { AdminUserService } from "../services/admin.user.service";
import { AdminCreateUserDTO, AdminUpdateUserDTO } from "../dtos/admin.user.dto";

const adminService = new AdminUserService();

export class AdminUserController {
  async create(req: Request, res: Response) {
    const parsed = AdminCreateUserDTO.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: z.prettifyError(parsed.error) });
    }

    const file = (req as any).file as Express.Multer.File | undefined;
    const filename = file?.filename ?? null;

    const user = await adminService.createUser(parsed.data, filename);
    return res.status(201).json({ success: true, data: user });
  }

  async list(_req: Request, res: Response) {
    const users = await adminService.getUsers();
    return res.status(200).json({ success: true, data: users });
  }

  async getById(req: Request, res: Response) {
    const user = await adminService.getUserById(req.params.id);
    return res.status(200).json({ success: true, data: user });
  }

  async update(req: Request, res: Response) {
    const parsed = AdminUpdateUserDTO.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: z.prettifyError(parsed.error) });
    }

    const file = (req as any).file as Express.Multer.File | undefined;
    const filename = file?.filename ?? null;

    const updated = await adminService.updateUser(req.params.id, parsed.data, filename);
    return res.status(200).json({ success: true, data: updated });
  }

 // DELETE /api/admin/users/:id  (SOFT)
async remove(req: Request, res: Response) {
  const updated = await adminService.softDeleteUser(req.params.id);
  return res.status(200).json({ success: true, data: updated, message: "User soft deleted" });
}

// DELETE /api/admin/users/:id/hard  (HARD)
async hardRemove(req: Request, res: Response) {
  const deleted = await adminService.hardDeleteUser(req.params.id);
  return res.status(200).json({ success: true, data: deleted, message: "User hard deleted" });
}


  
}
