import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Put it in your root .env file.");
}

export const pool = new Pool({
  connectionString: DATABASE_URL,
});

export async function query(text: string, params: any[] = []) {
  return pool.query(text, params);
}

