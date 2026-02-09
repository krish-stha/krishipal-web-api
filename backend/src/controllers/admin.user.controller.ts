import { Request, Response } from "express";
import z from "zod";
import mongoose from "mongoose";
import { AdminUserService } from "../services/admin.user.service";
import { AdminCreateUserDTO, AdminUpdateUserDTO } from "../dtos/admin.user.dto";

const adminService = new AdminUserService();

const ListQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .refine((v) => v === undefined || (Number.isInteger(v) && v > 0), {
      message: "page must be a positive integer",
    }),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .refine((v) => v === undefined || (Number.isInteger(v) && v > 0), {
      message: "limit must be a positive integer",
    }),
});

function validateObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

export class AdminUserController {
  async create(req: Request, res: Response) {
    const parsed = AdminCreateUserDTO.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, errors: z.prettifyError(parsed.error) });
    }

    const file = (req as any).file as Express.Multer.File | undefined;
    const filename = file?.filename ?? null;

    const user = await adminService.createUser(parsed.data, filename);
    return res.status(201).json({ success: true, data: user });
  }

  /**
   * GET /api/admin/users
   * Backward compatible:
   * - No page/limit => returns ALL users (old behavior)
   * - With page/limit => returns paginated data + meta
   */
  async list(req: Request, res: Response) {
    const parsedQuery = ListQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      return res
        .status(400)
        .json({ success: false, errors: z.prettifyError(parsedQuery.error) });
    }

    const { page, limit } = parsedQuery.data;

    // ✅ Keep old behavior if pagination params are not provided
    if (!page && !limit) {
      const users = await adminService.getUsers();
      return res.status(200).json({ success: true, data: users });
    }

    // ✅ Paginated behavior
    const pageNum = page ?? 1;
    const limitNum = Math.min(limit ?? 10, 100); // safety cap max 100

    const result = await adminService.getUsersPaginated(pageNum, limitNum);

    return res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  }

  async getById(req: Request, res: Response) {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id format",
      });
    }

    const user = await adminService.getUserById(id);
    return res.status(200).json({ success: true, data: user });
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id format",
      });
    }

    const parsed = AdminUpdateUserDTO.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, errors: z.prettifyError(parsed.error) });
    }

    const file = (req as any).file as Express.Multer.File | undefined;
    const filename = file?.filename ?? null;

    const updated = await adminService.updateUser(id, parsed.data, filename);
    return res.status(200).json({ success: true, data: updated });
  }

  // DELETE /api/admin/users/:id  (SOFT)
  async remove(req: Request, res: Response) {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id format",
      });
    }

    const updated = await adminService.softDeleteUser(id);
    return res
      .status(200)
      .json({ success: true, data: updated, message: "User soft deleted" });
  }

  // DELETE /api/admin/users/:id/hard  (HARD)
  async hardRemove(req: Request, res: Response) {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id format",
      });
    }

    const deleted = await adminService.hardDeleteUser(id);
    return res
      .status(200)
      .json({ success: true, data: deleted, message: "User hard deleted" });
  }
}
