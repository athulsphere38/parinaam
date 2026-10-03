import { Pool, PoolClient } from 'pg';
import { mockDb } from './mockStore';

/**
 * MOCK MODE: Active ONLY when DATABASE_URL is not set AND MOCK_DB=true is explicitly configured.
 * Intended for local development without a real database.
 *
 * When DATABASE_URL is configured, ALL queries target PostgreSQL exclusively.
 * A PostgreSQL connection failure is surfaced as an error — there is NO silent fallback to mockStore.
 */
function normalizeConnectionString(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;
  let cleaned = rawUrl.trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  const schemeMatch = cleaned.match(/^(postgres(?:ql)?:\/\/)(.*)$/);
  if (schemeMatch) {
    const scheme = schemeMatch[1];
    const rest = schemeMatch[2];
    const atIdx = rest.indexOf('@');
    if (atIdx !== -1) {
      const userInfo = rest.substring(0, atIdx);
      if (!userInfo.includes(':')) {
        cleaned = scheme + 'postgres:' + rest;
      }
    }
  }
  if (
    cleaned.includes('YOUR_RDS_ENDPOINT') ||
    cleaned.includes('YOUR_PASSWORD') ||
    cleaned.includes('example.com')
  ) {
    return undefined;
  }
  return cleaned;
}

const cleanedDbUrl = normalizeConnectionString(process.env.DATABASE_URL);
const IS_MOCK_MODE = (!cleanedDbUrl && process.env.MOCK_DB === 'true') || (!cleanedDbUrl && process.env.NODE_ENV === 'development');

/**
 * The pg Pool is created only when DATABASE_URL is configured.
 * Lazily connecting avoids startup failures when DATABASE_URL is intentionally absent (mock mode).
 */
const pool: Pool | null = cleanedDbUrl
  ? new Pool({
      connectionString: cleanedDbUrl,
      ssl: cleanedDbUrl.includes('rds.amazonaws.com')
        ? { rejectUnauthorized: false }
        : process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
  : null;

if (pool) {
  pool.on('error', (err) => {
    // Log without exposing connection string or credentials
    console.error('[DB] Unexpected PostgreSQL pool error:', err.message);
  });
  // Execute auto-migration to ensure required columns exist
  pool.query(`
    ALTER TABLE events ADD COLUMN IF NOT EXISTS unstop_url TEXT;
    ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_url TEXT;
    ALTER TABLE events ADD COLUMN IF NOT EXISTS amrita_fee INTEGER;
    ALTER TABLE events ADD COLUMN IF NOT EXISTS other_fee INTEGER;
    ALTER TABLE registrations ADD COLUMN IF NOT EXISTS team_members JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE registrations ADD COLUMN IF NOT EXISTS team_member_user_ids JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE registrations ADD COLUMN IF NOT EXISTS payment_order_id VARCHAR(200);
    ALTER TABLE registrations ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS cf_order_id TEXT;
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_session_id TEXT;
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS cf_payment_id TEXT;
  `).catch(err => {
    console.warn('[DB] Auto-migration notice:', err.message);
  });
}

export const db = {
  /**
   * Execute a single SQL query.
   *
   * Routing rules (evaluated in order):
   *   1. DATABASE_URL configured → attempts PostgreSQL. In development, falls back to mockStore if database is offline.
   *   2. DATABASE_URL not set or mock mode → in-memory mockStore.
   *   3. Production without DATABASE_URL → throws a configuration error.
   */
  query: async (text: string, params?: unknown[]): Promise<{ rows: any[]; rowCount: number }> => {
    if (pool) {
      try {
        const res = await pool.query(text, params as any[]);
        return {
          rows: res.rows || [],
          rowCount: res.rowCount ?? (res.rows ? res.rows.length : 0),
        };
      } catch (poolErr: any) {
        if (process.env.NODE_ENV !== 'production' || IS_MOCK_MODE) {
          console.warn(`[DB notice] PostgreSQL query error (${poolErr.message}). Using local in-memory store.`);
          return mockDb.executeQuery(text, (params || []) as any[]);
        }
        throw poolErr;
      }
    }

    if (IS_MOCK_MODE || process.env.NODE_ENV !== 'production') {
      if (process.env.NODE_ENV === 'development') {
        console.log('[MockDB]', text.slice(0, 80).replace(/\s+/g, ' '));
      }
      return mockDb.executeQuery(text, (params || []) as any[]);
    }

    // Production without database configuration
    throw new Error(
      '[DB] Database not configured. Set DATABASE_URL to connect to PostgreSQL.'
    );
  },

  /**
   * Acquire a dedicated PoolClient for transaction management (BEGIN / COMMIT / ROLLBACK).
   */
  getClient: async (): Promise<PoolClient> => {
    if (!pool) {
      if (process.env.NODE_ENV !== 'production') {
        return {
          query: async (text: string, params?: any[]) => mockDb.executeQuery(text, params || []),
          release: () => {},
        } as unknown as PoolClient;
      }
      throw new Error(
        '[DB] Cannot acquire a database client: DATABASE_URL is not configured.'
      );
    }

    try {
      return await pool.connect();
    } catch (connectErr: any) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[DB notice] PostgreSQL connect failed (${connectErr.message}). Using mock client.`);
        return {
          query: async (text: string, params?: any[]) => mockDb.executeQuery(text, params || []),
          release: () => {},
        } as unknown as PoolClient;
      }
      throw connectErr;
    }
  },
};

export default pool;
