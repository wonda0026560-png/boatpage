/**
 * 원다마린산업 웹 서버.
 *
 * 한 프로세스가 세 가지를 맡는다.
 *   1. 빌드된 정적 사이트(out/) 서빙 + SPA 폴백
 *   2. 게시판 공개 API        /api/posts, /api/images
 *   3. 관리자 API             /api/admin/*  (비밀번호 로그인, 글·사진 관리)
 *
 * 환경변수
 *   DATABASE_URL     Postgres 접속 주소 (Railway 가 주입)
 *   ADMIN_PASSWORD   관리자 비밀번호
 *   SESSION_SECRET   로그인 쿠키 서명 키 (긴 무작위 문자열)
 *   PORT             Railway 가 주입. 로컬 기본 3000
 */
import express from 'express';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import sharp from 'sharp';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, initSchema } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../out');
const PORT = Number(process.env.PORT) || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const SESSION_SECRET = process.env.SESSION_SECRET || '';
const IS_PROD = process.env.NODE_ENV === 'production' || Boolean(process.env.RAILWAY_ENVIRONMENT);

const COOKIE = 'wonda_admin';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const CATEGORIES = ['소식', '수상', '수출', '신모델'];
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// ---------------------------------------------------------------------------
// 인증
// ---------------------------------------------------------------------------

function sign(payload) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
}

/** 만료 시각과 그 서명을 붙인 토큰. 서버에 세션 저장소가 필요 없다. */
function issueToken() {
  const exp = String(Date.now() + SESSION_TTL_MS);
  return `${exp}.${sign(exp)}`;
}

function verifyToken(token) {
  if (!token || !SESSION_SECRET) return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig) return false;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(exp));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  return Number(exp) > Date.now();
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

/** 비밀번호 무차별 대입 방지. 5회 실패하면 10분 잠근다. */
const attempts = new Map();
function loginGate(ip) {
  const a = attempts.get(ip);
  if (a && a.lockedUntil > Date.now()) return false;
  return true;
}
function loginFailed(ip) {
  const a = attempts.get(ip) || { count: 0, lockedUntil: 0 };
  a.count += 1;
  if (a.count >= 5) {
    a.lockedUntil = Date.now() + 10 * 60 * 1000;
    a.count = 0;
  }
  attempts.set(ip, a);
}
function loginSucceeded(ip) {
  attempts.delete(ip);
}

function requireAdmin(req, res, next) {
  if (verifyToken(req.cookies[COOKIE])) return next();
  res.status(401).json({ error: '로그인이 필요합니다.' });
}

function requireDb(_req, res, next) {
  if (!pool) return res.status(503).json({ error: 'DATABASE_URL 이 설정되지 않았습니다.' });
  next();
}

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: IS_PROD,
  maxAge: SESSION_TTL_MS,
  path: '/',
});

app.post('/api/admin/login', (req, res) => {
  const ip = req.ip;
  if (!ADMIN_PASSWORD || !SESSION_SECRET) {
    return res.status(503).json({ error: 'ADMIN_PASSWORD 와 SESSION_SECRET 을 설정해야 합니다.' });
  }
  if (!loginGate(ip)) {
    return res.status(429).json({ error: '실패가 잦아 잠시 잠겼습니다. 10분 뒤 다시 시도하세요.' });
  }
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!password || !safeEqual(password, ADMIN_PASSWORD)) {
    loginFailed(ip);
    return res.status(401).json({ error: '비밀번호가 맞지 않습니다.' });
  }
  loginSucceeded(ip);
  res.cookie(COOKIE, issueToken(), cookieOptions());
  res.json({ ok: true });
});

app.post('/api/admin/logout', (_req, res) => {
  res.clearCookie(COOKIE, { path: '/' });
  res.json({ ok: true });
});

app.get('/api/admin/me', requireAdmin, (_req, res) => {
  res.json({ ok: true, db: Boolean(pool) });
});

// ---------------------------------------------------------------------------
// 조회 도우미
// ---------------------------------------------------------------------------

const IMAGES_AGG = `
  COALESCE(
    json_agg(
      json_build_object('id', i.id, 'alt', i.alt, 'width', i.width, 'height', i.height)
      ORDER BY i.sort, i.id
    ) FILTER (WHERE i.id IS NOT NULL),
    '[]'
  ) AS images`;

const POST_COLS = `p.id, p.slug, p.title, p.category, p.summary, p.body, p.date, p.published, p.updated_at`;

async function selectPosts(where, params) {
  const { rows } = await pool.query(
    `SELECT ${POST_COLS}, ${IMAGES_AGG}
       FROM posts p LEFT JOIN images i ON i.post_id = p.id
      ${where}
      GROUP BY p.id
      ORDER BY p.date DESC, p.id DESC`,
    params
  );
  return rows;
}

/** 같은 날 여러 글이 있어도 순서가 흔들리지 않도록 (date, id) 쌍으로 이웃을 찾는다. */
async function neighbors(post) {
  const [newer, older] = await Promise.all([
    pool.query(
      `SELECT slug, title FROM posts WHERE published AND (date, id) > ($1, $2)
        ORDER BY date ASC, id ASC LIMIT 1`,
      [post.date, post.id]
    ),
    pool.query(
      `SELECT slug, title FROM posts WHERE published AND (date, id) < ($1, $2)
        ORDER BY date DESC, id DESC LIMIT 1`,
      [post.date, post.id]
    ),
  ]);
  return { newer: newer.rows[0] ?? null, older: older.rows[0] ?? null };
}

// ---------------------------------------------------------------------------
// 공개 API
// ---------------------------------------------------------------------------

app.get('/api/posts', requireDb, async (_req, res, next) => {
  try {
    res.json(await selectPosts('WHERE p.published', []));
  } catch (e) {
    next(e);
  }
});

app.get('/api/posts/:slug', requireDb, async (req, res, next) => {
  try {
    const [post] = await selectPosts('WHERE p.published AND p.slug = $1', [req.params.slug]);
    if (!post) return res.status(404).json({ error: '글을 찾을 수 없습니다.' });
    res.json({ ...post, ...(await neighbors(post)) });
  } catch (e) {
    next(e);
  }
});

app.get('/api/images/:id', requireDb, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).end();
    const { rows } = await pool.query('SELECT mime, data FROM images WHERE id = $1', [id]);
    if (!rows[0]) return res.status(404).end();
    // 사진은 올린 뒤 바뀌지 않으므로(수정은 새로 올림) 오래 캐시해도 안전하다
    res.set('Content-Type', rows[0].mime);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(rows[0].data);
  } catch (e) {
    next(e);
  }
});

// ---------------------------------------------------------------------------
// 관리자 API — 글
// ---------------------------------------------------------------------------

function makeSlug(date) {
  return `${date.replaceAll('-', '')}-${crypto.randomBytes(3).toString('hex')}`;
}

app.get('/api/admin/posts', requireAdmin, requireDb, async (_req, res, next) => {
  try {
    res.json(await selectPosts('', []));
  } catch (e) {
    next(e);
  }
});

/** 빈 초안을 먼저 만든다. 사진은 글 id 에 붙기 때문에 편집기는 항상 id 를 갖고 시작한다. */
app.post('/api/admin/posts', requireAdmin, requireDb, async (_req, res, next) => {
  try {
    const { rows: d } = await pool.query(`SELECT to_char(CURRENT_DATE, 'YYYY-MM-DD') AS today`);
    const today = d[0].today;
    const { rows } = await pool.query(
      `INSERT INTO posts (slug, title, date) VALUES ($1, '', $2) RETURNING id`,
      [makeSlug(today), today]
    );
    const [post] = await selectPosts('WHERE p.id = $1', [rows[0].id]);
    res.status(201).json(post);
  } catch (e) {
    next(e);
  }
});

app.get('/api/admin/posts/:id', requireAdmin, requireDb, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: '잘못된 id' });
    const [post] = await selectPosts('WHERE p.id = $1', [id]);
    if (!post) return res.status(404).json({ error: '글을 찾을 수 없습니다.' });
    res.json(post);
  } catch (e) {
    next(e);
  }
});

app.put('/api/admin/posts/:id', requireAdmin, requireDb, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: '잘못된 id' });
    const b = req.body ?? {};
    const title = String(b.title ?? '').trim();
    const slug = String(b.slug ?? '').trim().toLowerCase();
    const category = String(b.category ?? '');
    const summary = String(b.summary ?? '').trim();
    const body = String(b.body ?? '').replace(/\r\n/g, '\n').trim();
    const date = String(b.date ?? '');
    const published = Boolean(b.published);

    if (!SLUG_RE.test(slug)) return res.status(400).json({ error: '주소는 영문 소문자·숫자·하이픈만 쓸 수 있습니다.' });
    if (!CATEGORIES.includes(category)) return res.status(400).json({ error: '분류가 올바르지 않습니다.' });
    if (!DATE_RE.test(date)) return res.status(400).json({ error: '날짜 형식이 올바르지 않습니다.' });
    if (published && !title) return res.status(400).json({ error: '공개하려면 제목이 필요합니다.' });

    const { rowCount } = await pool.query(
      `UPDATE posts
          SET title=$2, slug=$3, category=$4, summary=$5, body=$6, date=$7, published=$8, updated_at=now()
        WHERE id=$1`,
      [id, title, slug, category, summary, body, date, published]
    );
    if (!rowCount) return res.status(404).json({ error: '글을 찾을 수 없습니다.' });
    const [post] = await selectPosts('WHERE p.id = $1', [id]);
    res.json(post);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: '이미 쓰고 있는 주소입니다. 다른 주소를 입력하세요.' });
    next(e);
  }
});

app.delete('/api/admin/posts/:id', requireAdmin, requireDb, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: '잘못된 id' });
    await pool.query('DELETE FROM posts WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// ---------------------------------------------------------------------------
// 관리자 API — 사진
// ---------------------------------------------------------------------------

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('이미지 파일만 올릴 수 있습니다.'));
  },
});

app.post(
  '/api/admin/posts/:id/images',
  requireAdmin,
  requireDb,
  upload.single('image'),
  async (req, res, next) => {
    try {
      const postId = Number(req.params.id);
      if (!Number.isInteger(postId)) return res.status(400).json({ error: '잘못된 id' });
      if (!req.file) return res.status(400).json({ error: '파일이 없습니다.' });

      /*
        휴대폰 원본(4000px, 수 MB)을 그대로 넣으면 DB 와 페이지가 같이 무거워진다.
        긴 변 1600px 로 줄이고 JPEG 로 통일한다. rotate() 는 EXIF 회전을 픽셀에 반영한다.
      */
      const { data, info } = await sharp(req.file.buffer)
        .rotate()
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer({ resolveWithObject: true });

      const { rows: s } = await pool.query(
        'SELECT COALESCE(MAX(sort), -1) + 1 AS next FROM images WHERE post_id = $1',
        [postId]
      );
      const { rows } = await pool.query(
        `INSERT INTO images (post_id, mime, data, width, height, sort)
         VALUES ($1, 'image/jpeg', $2, $3, $4, $5)
         RETURNING id, alt, width, height`,
        [postId, data, info.width, info.height, s[0].next]
      );
      res.status(201).json(rows[0]);
    } catch (e) {
      if (e.code === '23503') return res.status(404).json({ error: '글을 찾을 수 없습니다.' });
      next(e);
    }
  }
);

app.put('/api/admin/images/:id', requireAdmin, requireDb, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: '잘못된 id' });
    const alt = String(req.body?.alt ?? '').trim();
    const { rows } = await pool.query(
      'UPDATE images SET alt = $2 WHERE id = $1 RETURNING id, alt, width, height',
      [id, alt]
    );
    if (!rows[0]) return res.status(404).json({ error: '사진을 찾을 수 없습니다.' });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

app.delete('/api/admin/images/:id', requireAdmin, requireDb, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: '잘못된 id' });
    await pool.query('DELETE FROM images WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// ---------------------------------------------------------------------------
// 정적 사이트
// ---------------------------------------------------------------------------

// 해시가 붙은 빌드 산출물은 내용이 바뀌면 이름도 바뀌므로 1년 캐시
app.use('/assets', express.static(path.join(OUT_DIR, 'assets'), { immutable: true, maxAge: '1y', fallthrough: false }));
app.use(express.static(OUT_DIR, { index: false, maxAge: '1h' }));

// 나머지 GET 은 전부 index.html — 라우팅은 클라이언트가 한다
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: '없는 API 입니다.' });
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  res.set('Cache-Control', 'no-cache');
  res.sendFile(path.join(OUT_DIR, 'index.html'));
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || /이미지 파일만/.test(err.message)) {
    return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? '15MB 이하 파일만 올릴 수 있습니다.' : err.message });
  }
  /*
    express.static(fallthrough:false) 이 넘기는 404, body-parser 의 400 처럼
    상태 코드가 실려 온 에러는 그대로 내보낸다. 전부 500 으로 뭉개면
    없는 파일 요청까지 서버 장애로 기록된다.
  */
  const status = Number(err.status || err.statusCode);
  if (status >= 400 && status < 500) {
    return res.status(status).json({ error: status === 404 ? '찾을 수 없습니다.' : err.message });
  }
  console.error(err);
  res.status(500).json({ error: '서버 오류가 났습니다.' });
});

// ---------------------------------------------------------------------------

try {
  await initSchema();
  console.log(pool ? '[db] 연결·스키마 확인 완료' : '[db] DATABASE_URL 없음 — 게시판 API 비활성');
} catch (e) {
  // DB 가 죽어도 사이트 자체는 떠 있어야 한다
  console.error('[db] 초기화 실패:', e.message);
}
if (!ADMIN_PASSWORD || !SESSION_SECRET) {
  console.warn('[auth] ADMIN_PASSWORD / SESSION_SECRET 이 없어 관리자 로그인이 막혀 있습니다');
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[web] http://0.0.0.0:${PORT}`);
});
