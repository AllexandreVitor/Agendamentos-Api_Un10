import { pool } from './pool';

const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS appointments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name  VARCHAR(120) NOT NULL,
  client_email VARCHAR(160) NOT NULL,
  service      VARCHAR(120) NOT NULL,
  starts_at    TIMESTAMPTZ  NOT NULL,
  ends_at      TIMESTAMPTZ  NOT NULL,
  status       VARCHAR(20)  NOT NULL DEFAULT 'scheduled'
               CHECK (status IN ('scheduled', 'cancelled', 'completed')),
  notes        TEXT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT appointments_valid_range CHECK (ends_at > starts_at),
  CONSTRAINT appointments_no_overlap
    EXCLUDE USING gist (tstzrange(starts_at, ends_at) WITH &&)
    WHERE (status = 'scheduled')
);

CREATE INDEX IF NOT EXISTS idx_appointments_starts_at ON appointments (starts_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status    ON appointments (status);
`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function runMigrations(retries = 10): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query(MIGRATION_SQL);
      console.log('[db] migrações aplicadas');
      return;
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`[db] banco indisponível (tentativa ${attempt}/${retries}), aguardando...`);
      await sleep(2000);
    }
  }
}
