import { Pool } from 'pg';

// Conexão com o PostgreSQL usando DATABASE_URL ou valores padrão locais
const databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/sgm_db';

export const pool = new Pool({
  connectionString: databaseUrl,
  connectionTimeoutMillis: 5000,
});

let isDatabaseConnected = false;

export function getDatabaseStatus(): boolean {
  return isDatabaseConnected;
}

// Inicializa as tabelas no PostgreSQL se existirem permissões
export async function initDatabase(): Promise<boolean> {
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash TEXT,
          google_id VARCHAR(255) UNIQUE,
          avatar_url TEXT,
          role VARCHAR(20) DEFAULT 'player',
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sessions (
          id UUID PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token VARCHAR(255) UNIQUE NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS campaigns (
          id UUID PRIMARY KEY,
          owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(100) NOT NULL,
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
      `);
      isDatabaseConnected = true;
      console.log('📦 PostgreSQL: Tabelas verificadas e prontas com sucesso.');
      return true;
    } finally {
      client.release();
    }
  } catch (err: any) {
    isDatabaseConnected = false;
    console.warn(
      `⚠️ PostgreSQL não conectado (${err.message || 'offline'}). O servidor operará com fallback gracioso para modo local.`,
    );
    return false;
  }
}
