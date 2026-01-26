import { FastifyInstance } from "fastify";
import { z } from "zod";
import { query } from "../db.js";

export async function promosRoutes(app: FastifyInstance) {
  app.get("/places/:id/promos", async (req, reply) => {
    const placeId = Number((req.params as any).id);
    if (!Number.isFinite(placeId)) return reply.code(400).send({ error: "Invalid place id" });

    const result = await query(
      `
      SELECT id, place_id AS "placeId", title, description,
             discount_text AS "discountText", active,
             start_at AS "startAt", end_at AS "endAt", created_at AS "createdAt"
      FROM promos
      WHERE place_id = $1 AND active = true
      ORDER BY created_at DESC
      `,
      [placeId]
    );

    return result.rows;
  });

  // TEMP endpoint: later restrict to verified business accounts
  const Schema = z.object({
    title: z.string().min(2).max(60),
    description: z.string().max(300).optional().default(""),
    discountText: z.string().max(40).optional().default(""),
    active: z.boolean().optional().default(true),
  });

  app.post("/places/:id/promos", async (req, reply) => {
    const placeId = Number((req.params as any).id);
    if (!Number.isFinite(placeId)) return reply.code(400).send({ error: "Invalid place id" });

    const body = Schema.parse(req.body);

    const result = await query(
      `
      INSERT INTO promos (place_id, title, description, discount_text, active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
      `,
      [placeId, body.title, body.description, body.discountText, body.active]
    );

    return { id: result.rows[0].id };
  });
}
