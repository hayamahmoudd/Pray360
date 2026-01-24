import { FastifyInstance } from "fastify";
import { z } from "zod";
import { query } from "../db";

export async function reviewsRoutes(app: FastifyInstance) {
  app.get("/places/:id/reviews", async (req, reply) => {
    const placeId = Number((req.params as any).id);
    if (!Number.isFinite(placeId)) return reply.code(400).send({ error: "Invalid place id" });

    const result = await query(
      `
      SELECT id, place_id AS "placeId", user_id AS "userId",
             rating, comment, prayed_here AS "prayedHere", created_at AS "createdAt"
      FROM reviews
      WHERE place_id = $1
      ORDER BY created_at DESC
      LIMIT 50
      `,
      [placeId]
    );

    return result.rows;
  });

  const Schema = z.object({
    userId: z.number().int().positive(), // TEMP until auth exists
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(500).optional().default(""),
    prayedHere: z.boolean().optional().default(true),
  });

  app.post("/places/:id/reviews", async (req, reply) => {
    const placeId = Number((req.params as any).id);
    if (!Number.isFinite(placeId)) return reply.code(400).send({ error: "Invalid place id" });

    const body = Schema.parse(req.body);

    const result = await query(
      `
      INSERT INTO reviews (place_id, user_id, rating, comment, prayed_here)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (place_id, user_id)
      DO UPDATE SET rating = EXCLUDED.rating,
                    comment = EXCLUDED.comment,
                    prayed_here = EXCLUDED.prayed_here
      RETURNING id;
      `,
      [placeId, body.userId, body.rating, body.comment, body.prayedHere]
    );

    return { id: result.rows[0].id };
  });
}
