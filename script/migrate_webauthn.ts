import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function run() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS webauthn_credentials (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      credential_id TEXT NOT NULL UNIQUE,
      public_key TEXT NOT NULL,
      counter BIGINT NOT NULL DEFAULT 0,
      transports JSONB DEFAULT '[]',
      created_at BIGINT NOT NULL
    )
  `);
  console.log('webauthn_credentials table created');
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
