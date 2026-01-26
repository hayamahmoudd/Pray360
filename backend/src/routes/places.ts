import { FastifyInstance } from "fastify";
import { z } from "zod";
import { query } from "../db.js";

export async function placesRoutes(app: FastifyInstance) {
  app.post("/places", async (req, reply) => {
    try {
      const Schema = z.object({
        name: z.string().min(2).max(80),
        address: z.string().max(140).optional().nullable(),
        isVerified: z.boolean().optional().default(false),
        ownerId: z.number().int().positive().optional().nullable(),
        lat: z.number(),
        lng: z.number(),
        capacity: z.number().int().positive().optional().nullable(),
        requiresRegistration: z.boolean().optional().default(false),
      });

      const body = Schema.parse(req.body);
      
      console.log("Creating place:", body);

      const result = await query(
        `
        INSERT INTO places (name, address, is_verified, owner_id, lat, lng, geom, capacity, requires_registration)
        VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($7, $5), 4326), $8, $9)
        RETURNING id
        `,
        [
          body.name, 
          body.address ?? null, 
          body.isVerified,
          body.ownerId ?? null,
          body.lat, 
          body.lng, 
          body.lng,
          body.capacity ?? null,
          body.requiresRegistration
        ]
      );

      const placeId = result.rows[0].id;
      console.log("Place created with ID:", placeId);

      return { id: placeId };
    } catch (error: any) {
      console.error("Error creating place:", error);
      return reply.code(500).send({ error: error.message || String(error) });
    }
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
        p.address,
        p.is_verified AS "isVerified",
        p.owner_id AS "ownerId",
        p.lat,
        p.lng,
        p.capacity,
        p.requires_registration AS "requiresRegistration",
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