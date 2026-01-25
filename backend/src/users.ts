import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { query } from "./db.js";

export async function usersRoutes(app: FastifyInstance) {
  // Create or get user
  app.post("/users", async (req) => {
    const Schema = z.object({
      name: z.string().min(2).max(50),
      email: z.string().email(),
    });

    const body = Schema.parse(req.body);

    const result = await query(
      `
      INSERT INTO users (name, email)
      VALUES ($1, $2)
      ON CONFLICT (email) 
      DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name, email, is_verified AS "isVerified"
      `,
      [body.name, body.email]
    );

    return result.rows[0];
  });

  // Get user by ID
  app.get("/users/:id", async (req, reply) => {
    const userId = Number((req.params as any).id);
    if (!Number.isFinite(userId)) return reply.code(400).send({ error: "Invalid user id" });

    const result = await query(
      `
      SELECT id, name, email, is_verified AS "isVerified",
             (SELECT COUNT(*) FROM reviews WHERE user_id = $1) AS "reviewCount",
             (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE user_id = $1) AS "avgRating"
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return reply.code(404).send({ error: "User not found" });
    }

    return result.rows[0];
  });
}