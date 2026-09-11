import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, signToken } from "../middleware/auth";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(80),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  locationName: z.string().max(200).optional(),
});

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password, name, lat, lng, locationName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "An account with that email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, name, lat, lng, locationName },
  });

  const token = signToken({ userId: user.id, email: user.email });
  return res.status(201).json({ token, user: toPublicUser(user) });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = signToken({ userId: user.id, email: user.email });
  return res.json({ token, user: toPublicUser(user) });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.json({ user: toPublicUser(user) });
});

const updateLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  locationName: z.string().max(200).optional(),
});

authRouter.patch("/me/location", requireAuth, async (req, res) => {
  const parsed = updateLocationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const user = await prisma.user.update({
    where: { id: req.auth!.userId },
    data: parsed.data,
  });
  return res.json({ user: toPublicUser(user) });
});

function toPublicUser(user: {
  id: string;
  email: string;
  name: string;
  lat: number | null;
  lng: number | null;
  locationName: string | null;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    lat: user.lat,
    lng: user.lng,
    locationName: user.locationName,
    createdAt: user.createdAt,
  };
}
