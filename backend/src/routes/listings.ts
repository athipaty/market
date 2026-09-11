import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import { boundingBox, haversineKm } from "../utils/geo";

export const listingsRouter = Router();

const createListingSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(4000),
  price: z.number().min(0),
  category: z.string().min(1).max(60),
  images: z.array(z.string().min(1).max(500)).max(10).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  locationName: z.string().max(200).optional(),
});

listingsRouter.post("/", requireAuth, async (req, res) => {
  const parsed = createListingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const listing = await prisma.listing.create({
    data: { ...parsed.data, images: parsed.data.images ?? [], sellerId: req.auth!.userId },
  });
  return res.status(201).json({ listing });
});

const searchQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().min(0.1).max(500).default(25),
  q: z.string().max(120).optional(),
  category: z.string().max(60).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
});

// Search active listings near a given point, ordered by distance.
listingsRouter.get("/", async (req, res) => {
  const parsed = searchQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { lat, lng, radiusKm, q, category, limit } = parsed.data;
  const box = boundingBox(lat, lng, radiusKm);

  const candidates = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      lat: { gte: box.minLat, lte: box.maxLat },
      lng: { gte: box.minLng, lte: box.maxLng },
      ...(category ? { category } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { seller: { select: { id: true, name: true } } },
    take: 500,
    orderBy: { createdAt: "desc" },
  });

  const withDistance = candidates
    .map((listing) => ({
      ...listing,
      distanceKm: haversineKm(lat, lng, listing.lat, listing.lng),
    }))
    .filter((listing) => listing.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);

  return res.json({ listings: withDistance });
});

listingsRouter.get("/mine", requireAuth, async (req, res) => {
  const listings = await prisma.listing.findMany({
    where: { sellerId: req.auth!.userId },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ listings });
});

listingsRouter.get("/:id", async (req, res) => {
  const listing = await prisma.listing.findUnique({
    where: { id: req.params.id },
    include: { seller: { select: { id: true, name: true } } },
  });
  if (!listing) {
    return res.status(404).json({ error: "Listing not found" });
  }
  return res.json({ listing });
});

const updateListingSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().min(1).max(4000).optional(),
  price: z.number().min(0).optional(),
  category: z.string().min(1).max(60).optional(),
  images: z.array(z.string().min(1).max(500)).max(10).optional(),
  status: z.enum(["ACTIVE", "SOLD", "REMOVED"]).optional(),
});

listingsRouter.patch("/:id", requireAuth, async (req, res) => {
  const existing = await prisma.listing.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    return res.status(404).json({ error: "Listing not found" });
  }
  if (existing.sellerId !== req.auth!.userId) {
    return res.status(403).json({ error: "You do not own this listing" });
  }
  const parsed = updateListingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const listing = await prisma.listing.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  return res.json({ listing });
});

listingsRouter.delete("/:id", requireAuth, async (req, res) => {
  const existing = await prisma.listing.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    return res.status(404).json({ error: "Listing not found" });
  }
  if (existing.sellerId !== req.auth!.userId) {
    return res.status(403).json({ error: "You do not own this listing" });
  }
  await prisma.listing.delete({ where: { id: req.params.id } });
  return res.status(204).send();
});
