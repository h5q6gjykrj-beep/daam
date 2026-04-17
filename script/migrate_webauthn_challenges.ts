import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function run() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS webauthn_challenges (
      key TEXT PRIMARY KEY,
      challenge TEXT NOT NULL,
      expires_at BIGINT NOT NULL
    )
  `);
  console.log('webauthn_challenges table created');
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
