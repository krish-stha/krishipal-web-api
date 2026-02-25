import { Router } from "express";
import { AdminBlogController } from "../controllers/admin.blog.controller";
import { protect } from "../middleware/auth.middleware";
import { adminOnly } from "../middleware/admin.middleware";
import { blogUpload } from "../middleware/blogUpload";

const r = Router();
const c = new AdminBlogController();

r.use(protect, adminOnly);

// cover image field name must match frontend FormData key (you chose "cover")
r.post("/blogs", blogUpload.single("cover"), (req, res) => c.create(req as any, res));
r.get("/blogs", (req, res) => c.list(req as any, res));
r.get("/blogs/:id", (req, res) => c.getById(req as any, res));
r.put("/blogs/:id", blogUpload.single("cover"), (req, res) => c.update(req as any, res));
r.delete("/blogs/:id", (req, res) => c.remove(req as any, res));

export default r;