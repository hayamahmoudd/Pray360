import { FastifyInstance } from "fastify";
import { z } from "zod";
import { query } from "../db";
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
      SELECT id, place_id AS "placeId", user_id AS "userId",
             rating, comment, prayed_here AS "prayedHere", 
             photo_url AS "photoUrl", created_at AS "createdAt"
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
    userId: z.number().int().positive(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(500).optional().default(""),
    prayedHere: z.boolean().optional().default(true),
  });

  app.post("/places/:id/reviews", async (req, reply) => {
    const placeId = Number((req.params as any).id);
    if (!Number.isFinite(placeId)) return reply.code(400).send({ error: "Invalid place id" });

    const isMultipart = req.isMultipart();
    let body: any;
    let photoUrl: string | null = null;

    if (isMultipart) {
      const parts = req.parts();
      const fields: any = {};

      for await (const part of parts) {
        if (part.type === 'file') {
          // Handle file upload
          const buffer = await part.toBuffer();
          const ext = part.filename.split('.').pop() || 'jpg';
          const filename = `${randomBytes(16).toString('hex')}.${ext}`;
          
          // Ensure uploads directory exists
          const uploadsDir = join(process.cwd(), 'uploads');
          await mkdir(uploadsDir, { recursive: true });
          
          const filepath = join(uploadsDir, filename);
          await writeFile(filepath, buffer);
          
          photoUrl = `/uploads/${filename}`;
        } else {
          // Handle form field
          fields[part.fieldname] = (part as any).value;
        }
      }

      body = {
        userId: Number(fields.userId),
        rating: Number(fields.rating),
        comment: fields.comment || "",
        prayedHere: fields.prayedHere === 'true',
      };
    } else {
      body = Schema.parse(req.body);
    }

    const result = await query(
      `
      INSERT INTO reviews (place_id, user_id, rating, comment, prayed_here, photo_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (place_id, user_id)
      DO UPDATE SET rating = EXCLUDED.rating,
                    comment = EXCLUDED.comment,
                    prayed_here = EXCLUDED.prayed_here,
                    photo_url = EXCLUDED.photo_url
      RETURNING id;
      `,
      [placeId, body.userId, body.rating, body.comment, body.prayedHere, photoUrl]
    );

    return { id: result.rows[0].id };
  });
}