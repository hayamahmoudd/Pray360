import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { pool } from "./db.js";
import { placesRoutes } from "./routes/places.js";

const app = Fastify({ logger: true });

// Allow your frontend to call the API
await app.register(cors, {
  origin: true,
  credentials: true,
});

app.get("/health", async () => {
  // Confirm DB connection and PostGIS presence
  const res = await pool.query("SELECT PostGIS_Version() AS v;");
  return { ok: true, postgis: res.rows[0]?.v ?? "unknown" };
});

// Routes
await app.register(placesRoutes);

const port = Number(process.env.PORT ?? 4000);

app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
