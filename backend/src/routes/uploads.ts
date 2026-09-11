import crypto from "crypto";
import path from "path";
import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth";
import { env } from "../env";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 6 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new Error("Only JPEG, PNG, WEBP, or GIF images are allowed"));
      return;
    }
    cb(null, true);
  },
});

export const uploadsRouter = Router();

uploadsRouter.post("/", requireAuth, upload.array("images", 6), (req, res) => {
  const files = (req.files as Express.Multer.File[]) ?? [];
  const urls = files.map((file) => `/uploads/${file.filename}`);
  return res.status(201).json({ urls });
});
