import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import pg from "pg";
const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing. Check your root .env file.");
}

export const pool = new Pool({ connectionString: databaseUrl });
