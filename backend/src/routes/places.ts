import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { pool } from "../db.js";

export async function placesRoutes(app: FastifyInstance) {
  /**
   * DEV ONLY: initialize DB (PostGIS + places table)
   * You can delete this route later once you add real migrations.
   */
  app.get("/dev/init", async () => {
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS postgis;

      CREATE TABLE IF NOT EXISTS places (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        address TEXT,
        is_verified BOOLEAN NOT NULL DEFAULT FALSE,
        created_by_user_id INT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        location geography(Point, 4326) NOT NULL
      );

      CREATE INDEX IF NOT EXISTS places_location_gix ON places USING GIST (location);
    `);

    return { ok: true };
  });

  /**
   * GET nearby places
   * /places/near?lat=43.54&lng=-80.24&radiusMeters=5000
   */
  app.get("/places/near", async (req) => {
    const q = z
      .object({
        lat: z.coerce.number().min(-90).max(90),
        lng: z.coerce.number().min(-180).max(180),
        radiusMeters: z.coerce.number().min(50).max(50000).default(4000),
      })
      .parse((req as any).query);

    const res = await pool.query(
      `
      SELECT
        id,
        name,
        type,
        address,
        is_verified,
        created_at,
        ST_Y(location::geometry) AS lat,
        ST_X(location::geometry) AS lng,
        ST_Distance(location, ST_MakePoint($2, $1)::geography) AS distance_meters
      FROM places
      WHERE ST_DWithin(location, ST_MakePoint($2, $1)::geography, $3)
      ORDER BY distance_meters ASC;
    `,
      [q.lat, q.lng, q.radiusMeters]
    );

    return res.rows;
  });

  /**
   * POST a new place
   */
  app.post("/places", async (req) => {
    const body = z
      .object({
        name: z.string().min(1).max(200),
        type: z.string().min(1).max(50),
        address: z.string().max(500).optional(),
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        createdByUserId: z.number().int().positive(),
      })
      .parse(req.body);

    const res = await pool.query(
      `
      INSERT INTO places (name, type, address, location, created_by_user_id)
      VALUES ($1, $2, $3, ST_MakePoint($5, $4)::geography, $6)
      RETURNING
        id,
        name,
        type,
        address,
        is_verified,
        created_at,
        ST_Y(location::geometry) AS lat,
        ST_X(location::geometry) AS lng;
    `,
      [
        body.name,
        body.type,
        body.address ?? null,
        body.lat,
        body.lng,
        body.createdByUserId,
      ]
    );

    return res.rows[0];
  });
}
