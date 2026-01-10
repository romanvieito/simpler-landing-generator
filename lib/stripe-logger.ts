// lib/stripe-logger.ts
import { sql } from '@vercel/postgres';

export interface StripeLogEntry {
  eventType: string;
  eventId: string;
  userId?: string;
  sessionId?: string;
  amount?: number;
  status: 'success' | 'error' | 'warning';
  message: string;
  metadata?: Record<string, any>;
}

export async function logStripeEvent(entry: StripeLogEntry) {
  try {
    await sql`
      INSERT INTO stripe_logs (
        event_type,
        event_id,
        user_id,
        session_id,
        amount,
        status,
        message,
        metadata,
        created_at
      ) VALUES (
        ${entry.eventType},
        ${entry.eventId},
        ${entry.userId || null},
        ${entry.sessionId || null},
        ${entry.amount || null},
        ${entry.status},
        ${entry.message},
        ${JSON.stringify(entry.metadata || {})},
        NOW()
      )
      ON CONFLICT (event_id, event_type) 
      DO UPDATE SET
        user_id = EXCLUDED.user_id,
        session_id = EXCLUDED.session_id,
        amount = EXCLUDED.amount,
        status = EXCLUDED.status,
        message = EXCLUDED.message,
        metadata = EXCLUDED.metadata,
        created_at = NOW()
    `;
  } catch (error) {
    // Fallback to console logging if database logging fails
    console.error('Failed to log to database:', error);
    console.log('Stripe Event:', entry);
  }
}

// Ensure stripe_logs table exists
export async function ensureStripeLogsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS stripe_logs (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        event_type TEXT NOT NULL,
        event_id TEXT NOT NULL,
        user_id TEXT,
        session_id TEXT,
        amount INTEGER,
        status TEXT NOT NULL CHECK (status IN ('success', 'error', 'warning')),
        message TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(event_id, event_type)
      )
    `;

    // Create index for efficient querying
    await sql`
      CREATE INDEX IF NOT EXISTS idx_stripe_logs_user_id_created_at
      ON stripe_logs(user_id, created_at DESC)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_stripe_logs_event_id
      ON stripe_logs(event_id)
    `;

    // Clean up old logs (keep last 30 days)
    await sql`
      DELETE FROM stripe_logs
      WHERE created_at < NOW() - INTERVAL '30 days'
    `;

  } catch (error) {
    console.error('Failed to create stripe_logs table:', error);
  }
}

// Get recent logs for a user
export async function getStripeLogsForUser(userId: string, limit = 50) {
  try {
    const { rows } = await sql`
      SELECT
        event_type,
        event_id,
        session_id,
        amount,
        status,
        message,
        metadata,
        created_at
      FROM stripe_logs
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return rows;
  } catch (error) {
    console.error('Failed to fetch stripe logs:', error);
    return [];
  }
}

// Get logs by event type
export async function getStripeLogsByType(eventType: string, limit = 100) {
  try {
    const { rows } = await sql`
      SELECT * FROM stripe_logs
      WHERE event_type = ${eventType}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return rows;
  } catch (error) {
    console.error('Failed to fetch stripe logs by type:', error);
    return [];
  }
}