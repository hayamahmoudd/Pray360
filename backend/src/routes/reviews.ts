import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { query } from "../db.js";
import multipart from "@fastify/multipart";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";

export async function reviewsRoutes(app: FastifyInstance) {
  // Register multipart for file uploads
  await app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max
    },
  });

  app.get("/places/:id/reviews", async (req, reply) => {
    const placeId = Number((req.params as any).id);
    if (!Number.isFinite(placeId)) return reply.code(400).send({ error: "Invalid place id" });

    const result = await query(
      `
      SELECT r.id, r.place_id AS "placeId", r.user_id AS "userId",
             r.rating, r.comment, r.prayed_here AS "prayedHere", 
             r.photo_url AS "photoUrl", r.created_at AS "createdAt",
             u.name AS "userName", u.is_verified AS "userVerified"
      FROM reviews r
      LEFT JOIN users u ON u.id = r.user_id
      WHERE r.place_id = $1
      ORDER BY r.created_at DESC
      LIMIT 50
      `,
      [placeId]
    );

    return result.rows;
  });

  const Schema = z.object({
    userId: z.number().int().positive(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(500).optional().default(""),
    prayedHere: z.boolean().optional().default(true),
  });

  app.post("/places/:id/reviews", async (req, reply) => {
    const placeId = Number((req.params as any).id);
    if (!Number.isFinite(placeId)) return reply.code(400).send({ error: "Invalid place id" });

    const body = Schema.parse(req.body);

    // Check if user is the owner of this place
    const placeCheck = await query(
      `SELECT owner_id FROM places WHERE id = $1`,
      [placeId]
    );

    if (placeCheck.rows.length > 0 && placeCheck.rows[0].owner_id === body.userId) {
      return reply.code(403).send({ error: "Business owners cannot review their own places" });
    }

    const result = await query(
      `
      INSERT INTO reviews (place_id, user_id, rating, comment, prayed_here)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (place_id, user_id)
      DO UPDATE SET rating = EXCLUDED.rating,
                    comment = EXCLUDED.comment,
                    prayed_here = EXCLUDED.prayed_here,
                    created_at = NOW()
      RETURNING id;
      `,
      [placeId, body.userId, body.rating, body.comment, body.prayedHere]
    );

    return { id: result.rows[0].id };
  });

  // Upload photo for review
  app.post("/reviews/:id/photo", async (req, reply) => {
    const reviewId = Number((req.params as any).id);
    if (!Number.isFinite(reviewId)) return reply.code(400).send({ error: "Invalid review id" });

    try {
      const data = await (req as any).file();
      if (!data) {
        return reply.code(400).send({ error: "No file uploaded" });
      }

      // Ensure uploads directory exists
      await mkdir(join(process.cwd(), 'uploads'), { recursive: true });

      // Generate unique filename
      const ext = data.filename.split('.').pop() || 'jpg';
      const filename = `${randomBytes(16).toString('hex')}.${ext}`;
      const filepath = join(process.cwd(), 'uploads', filename);

      // Save file
      const buffer = await data.toBuffer();
      await writeFile(filepath, buffer);

      // Update review with photo URL
      const photoUrl = `/uploads/${filename}`;
      await query(
        `UPDATE reviews SET photo_url = $1 WHERE id = $2`,
        [photoUrl, reviewId]
      );

      return { photoUrl };
    } catch (error) {
      console.error("Photo upload error:", error);
      return reply.code(500).send({ error: "Failed to upload photo" });
    }
  });
}