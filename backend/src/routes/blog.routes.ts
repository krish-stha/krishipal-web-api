import { Router } from "express";
import { BlogController } from "../controllers/blog.controller";

const r = Router();
const c = new BlogController();

r.get("/blogs", (req, res) => c.list(req, res));
r.get("/blogs/:slug", (req, res) => c.bySlug(req, res));

export default r;