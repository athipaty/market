import fs from "fs";
import http from "http";
import path from "path";
import cors from "cors";
import express from "express";
import { env } from "./env";
import { authRouter } from "./routes/auth";
import { listingsRouter } from "./routes/listings";
import { conversationsRouter } from "./routes/conversations";
import { uploadsRouter } from "./routes/uploads";
import { createChatServer } from "./sockets/chat";

fs.mkdirSync(env.uploadsDir, { recursive: true });

const app = express();
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(path.resolve(env.uploadsDir)));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/listings", listingsRouter);
app.use("/api/conversations", conversationsRouter);
app.use("/api/uploads", uploadsRouter);

// Serve the built frontend from the same service (single deployable/paid
// instance) when frontend/dist exists alongside this repo checkout.
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get(/^(?!\/api|\/uploads|\/socket\.io).*/, (_req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  const message = err instanceof Error ? err.message : "Internal server error";
  res.status(500).json({ error: message });
});

const httpServer = http.createServer(app);
createChatServer(httpServer);

httpServer.listen(env.port, () => {
  console.log(`Market backend listening on port ${env.port}`);
});
