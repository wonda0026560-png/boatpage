import pg from 'pg';

/*
  DATE 컬럼을 JS Date 로 바꾸지 않고 'YYYY-MM-DD' 문자열 그대로 받는다.
  Date 로 받으면 서버 시간대(UTC)에 따라 하루가 밀리는 사고가 난다.
*/
pg.types.setTypeParser(1082, (v) => v);

const url = process.env.DATABASE_URL || '';

/*
  Railway 내부 주소(railway.internal)와 로컬 접속은 SSL 이 없다.
  그 외(공개 프록시 주소 등)는 자체 서명 인증서라 검증만 끈 채 SSL 로 붙는다.
*/
function sslFor(u) {
  if (process.env.PGSSL === 'false') return false;
  if (/localhost|127\.0\.0\.1|railway\.internal/.test(u)) return false;
  if (!u.includes('@')) return false; // postgresql:///dbname 같은 로컬 소켓 접속
  return { rejectUnauthorized: false };
}

export const pool = url ? new pg.Pool({ connectionString: url, ssl: sslFor(url), max: 5 }) : null;

/** 서버가 뜰 때 필요한 테이블을 만든다. 이미 있으면 건드리지 않는다. */
export async function initSchema() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id          SERIAL PRIMARY KEY,
      slug        TEXT NOT NULL UNIQUE,
      title       TEXT NOT NULL DEFAULT '',
      category    TEXT NOT NULL DEFAULT '소식',
      summary     TEXT NOT NULL DEFAULT '',
      body        TEXT NOT NULL DEFAULT '',
      date        DATE NOT NULL DEFAULT CURRENT_DATE,
      published   BOOLEAN NOT NULL DEFAULT false,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS images (
      id          SERIAL PRIMARY KEY,
      post_id     INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      mime        TEXT NOT NULL,
      data        BYTEA NOT NULL,
      width       INTEGER,
      height      INTEGER,
      alt         TEXT NOT NULL DEFAULT '',
      sort        INTEGER NOT NULL DEFAULT 0,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS images_post_idx ON images (post_id, sort, id);
    CREATE INDEX IF NOT EXISTS posts_public_idx ON posts (published, date DESC, id DESC);
  `);
}
