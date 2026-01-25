import { FastifyInstance } from "fastify";
import { query } from "../db";

export async function devRoutes(app: FastifyInstance) {
  app.get("/dev/init", async () => {
    await query(`CREATE EXTENSION IF NOT EXISTS postgis;`);

    await query(`
      CREATE TABLE IF NOT EXISTS places (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'restaurant',
        address TEXT,
        is_verified BOOLEAN NOT NULL DEFAULT FALSE,
        lat DOUBLE PRECISION NOT NULL,
        lng DOUBLE PRECISION NOT NULL,
        geom geometry(Point, 4326) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT NOT NULL DEFAULT '',
        prayed_here BOOLEAN NOT NULL DEFAULT TRUE,
        photo_url TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS reviews_place_user_unique
      ON reviews(place_id, user_id);
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS promos (
        id SERIAL PRIMARY KEY,
        place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        discount_text TEXT NOT NULL DEFAULT '',
        active BOOLEAN NOT NULL DEFAULT TRUE,
        start_at TIMESTAMP NULL,
        end_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await query(`CREATE INDEX IF NOT EXISTS reviews_place_id_idx ON reviews(place_id);`);
    await query(`CREATE INDEX IF NOT EXISTS promos_place_id_idx ON promos(place_id);`);

    return { ok: true };
  });
  
  app.get("/dev/reset", async () => {
    await query(`DROP TABLE IF EXISTS promos;`);
    await query(`DROP TABLE IF EXISTS reviews;`);
    await query(`DROP TABLE IF EXISTS places;`);
    return { ok: true };
  });
}
