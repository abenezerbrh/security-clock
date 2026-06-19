// db/pool.js
// Connects to Postgres (Supabase). Reads connection string from env var.
// Once Supabase is set up, copy the connection string from
// Project Settings > Database > Connection string (URI) into your .env file.

const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.warn(
    '[db] DATABASE_URL is not set. Set it in your .env file once Supabase is ready.'
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase')
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('error', (err) => {
  console.error('[db] Unexpected error on idle client', err);
});

module.exports = pool;
