import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { join } from "path";

import { devRoutes } from "./routes/dev.js";
import { placesRoutes } from "./routes/places.js";
import { reviewsRoutes } from "./routes/reviews.js";
import { promosRoutes } from "./routes/promos.js";
import { usersRoutes } from "./users.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
});

// Serve uploaded files
await app.register(fastifyStatic, {
  root: join(process.cwd(), 'uploads'),
  prefix: '/uploads/',
});

app.get("/health", async () => ({ ok: true }));

await app.register(devRoutes);
await app.register(usersRoutes);
await app.register(placesRoutes);
await app.register(reviewsRoutes);
await app.register(promosRoutes);

const port = Number(process.env.PORT ?? 4000);
await app.listen({ port, host: "0.0.0.0" });