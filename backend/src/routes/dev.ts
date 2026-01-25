import { FastifyInstance } from "fastify";
import { query } from "../db";

export async function devRoutes(app: FastifyInstance) {
  app.get("/dev/init", async () => {
    try {
      await query(`CREATE EXTENSION IF NOT EXISTS postgis;`);

      await query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          is_verified BOOLEAN NOT NULL DEFAULT FALSE,
          is_business_owner BOOLEAN NOT NULL DEFAULT FALSE,
          gender TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS places (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          address TEXT,
          is_verified BOOLEAN NOT NULL DEFAULT FALSE,
          owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          lat DOUBLE PRECISION NOT NULL,
          lng DOUBLE PRECISION NOT NULL,
          geom geometry(Point, 4326),
          capacity INTEGER,
          requires_registration BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);

      // Create geom column separately if it doesn't exist
      try {
        await query(`
          DO $$ 
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name='places' AND column_name='geom') THEN
              ALTER TABLE places ADD COLUMN geom geometry(Point, 4326);
            END IF;
          END $$;
        `);
      } catch (e) {
        console.log('Geom column might already exist');
      }

      // Update existing rows with geom if they don't have it
      await query(`
        UPDATE places 
        SET geom = ST_SetSRID(ST_MakePoint(lng, lat), 4326)
        WHERE geom IS NULL;
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS reviews (
          id SERIAL PRIMARY KEY,
          place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

      return { ok: true, message: "Database initialized successfully" };
    } catch (error) {
      console.error("Database init error:", error);
      return { ok: false, error: String(error) };
    }
  });
  
  app.get("/dev/reset", async () => {
    await query(`DROP TABLE IF EXISTS promos;`);
    await query(`DROP TABLE IF EXISTS reviews;`);
    await query(`DROP TABLE IF EXISTS places;`);
    await query(`DROP TABLE IF EXISTS users;`);
    return { ok: true };
  });
}