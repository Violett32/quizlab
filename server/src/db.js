import pg from 'pg';

const { Pool } = pg;

// Один пул на весь процесс. DATABASE_URL приходит из .env.
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
