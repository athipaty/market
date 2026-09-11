import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: parseInt(process.env.PORT ?? "4000", 10),
  jwtSecret: required("JWT_SECRET", "dev-insecure-secret-change-me"),
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  uploadsDir: process.env.UPLOADS_DIR ?? "uploads",
};
