import { FastifyInstance } from "fastify";
import { z } from "zod";
import { query } from "../db";

export async function placesRoutes(app: FastifyInstance) {
  app.post("/places", async (req) => {
    const Schema = z.object({
      name: z.string().min(2).max(80),
      type: z.enum(["restaurant", "mall", "campus", "masjid", "other"]).default("other"),
      address: z.string().max(140).optional().nullable(),
      isVerified: z.boolean().optional().default(false),
      lat: z.number(),
      lng: z.number(),
    });

    const body = Schema.parse(req.body);

    const result = await query(
      `
      INSERT INTO places (name, type, address, is_verified, lat, lng, geom)
      VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($6, $5), 4326))
      RETURNING id
      `,
      [body.name, body.type, body.address ?? null, body.isVerified, body.lat, body.lng]
    );

    return { id: result.rows[0].id };
  });

  // Get nearby places including avg rating
  app.get("/places/near", async (req) => {
    const Schema = z.object({
      lat: z.coerce.number(),
      lng: z.coerce.number(),
      radiusMeters: z.coerce.number().default(5000),
    });

    const { lat, lng, radiusMeters } = Schema.parse((req as any).query);

    const result = await query(
      `
      SELECT
        p.id,
        p.name,
        p.type,
        p.address,
        p.is_verified AS "isVerified",
        p.lat,
        p.lng,
        COALESCE(AVG(r.rating), 0)::float AS "avgRating",
        COUNT(r.id)::int AS "reviewCount"
      FROM places p
      LEFT JOIN reviews r ON r.place_id = p.id
      WHERE ST_DWithin(
        p.geom::geography,
        ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
        $3
      )
      GROUP BY p.id
      ORDER BY "reviewCount" DESC, "avgRating" DESC
      LIMIT 200;
      `,
      [lat, lng, radiusMeters]
    );

    return result.rows;
  });
}
