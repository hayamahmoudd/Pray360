import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";

import { devRoutes } from "./routes/dev";
import { placesRoutes } from "./routes/places";
import { reviewsRoutes } from "./routes/reviews";
import { promosRoutes } from "./routes/promos";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
});

app.get("/health", async () => ({ ok: true }));

await app.register(devRoutes);
await app.register(placesRoutes);
await app.register(reviewsRoutes);
await app.register(promosRoutes);

const port = Number(process.env.PORT ?? 4000);
await app.listen({ port, host: "0.0.0.0" });
