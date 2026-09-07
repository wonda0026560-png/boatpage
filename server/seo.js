/**
 * 크롤러용 <head> 채우기, sitemap.xml, robots.txt.
 *
 * 사이트는 SPA 라 본문은 브라우저가 그리지만, 검색엔진과 카카오톡·페이스북
 * 미리보기는 서버가 준 HTML 의 <head> 만 본다. 그래서 첫 응답에서
 * 경로에 맞는 제목·설명·공유 카드를 index.html 에 끼워 넣는다.
 *
 * 고정 페이지 문구는 빌드가 남긴 out/site-routes.json (src/data/seo.ts) 에서,
 * 게시판 글은 DB 에서 온다.
 */
import fs from 'node:fs';
import path from 'node:path';

const SITE_NAME = '원다마린산업';
const SITE_URL = (process.env.SITE_URL || '').replace(/\/$/, '');

export function loadTemplate(outDir) {
  return fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
}

/** 빌드 산출물이 없으면(로컬 API 만 띄운 경우) 빈 목록. 서버는 그래도 떠야 한다. */
export function loadRoutes(outDir) {
  try {
    return JSON.parse(fs.readFileSync(path.join(outDir, 'site-routes.json'), 'utf8'));
  } catch {
    return [];
  }
}

/**
 * 절대 주소의 기준. SITE_URL 이 있으면 그것(커스텀 도메인이 canonical 이어야
 * railway.app 주소가 중복 페이지로 잡히지 않는다), 없으면 요청이 들어온 호스트.
 */
export function originFor(req) {
  return SITE_URL || `${req.protocol}://${req.get('host')}`;
}

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** src/lib/markdown.ts 의 markdownToText 와 같은 규칙. 문법이 바뀌면 둘 다 고친다. */
export function markdownToText(source) {
  return String(source)
    .replace(/\r\n/g, '\n')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*(?:[-*]|\d+[.)])\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|\*|`)(.+?)\1/g, '$2')
    .replace(/\s+/g, ' ')
    .trim();
}

export function clip(text, max) {
  const t = String(text).trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return `${space > max * 0.6 ? cut.slice(0, space) : cut}…`;
}

function setMeta(html, attr, name, value) {
  const re = new RegExp(`(<meta\\s+${attr}="${name}"\\s+content=")[^"]*(")`);
  return html.replace(re, `$1${escapeHtml(value)}$2`);
}

/**
 * index.html 의 <head> 를 주어진 값으로 바꾼다.
 *
 * meta.image 가 없으면 기본 공유 이미지(og-image.jpg)를 절대 주소로 다시 쓴다 —
 * 빌드 때 SITE_URL 이 비어 있었더라도 실제 요청 호스트로 완성된다.
 */
export function renderHead(template, meta) {
  const { origin } = meta;
  const url = `${origin}${meta.path}`;
  const image = meta.image ?? {
    url: `${origin}/og-image.jpg`,
    width: 1200,
    height: 630,
    alt: '완도 앞바다에 나란히 계류된 원다마린산업 어장관리선 두 척',
  };

  let html = template.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(meta.title)}</title>`);
  html = html.replace(/(<link\s+rel="canonical"\s+href=")[^"]*(")/, `$1${escapeHtml(url)}$2`);
  html = setMeta(html, 'name', 'description', meta.description);
  html = setMeta(html, 'name', 'robots', meta.robots ?? 'index, follow, max-image-preview:large');
  html = setMeta(html, 'property', 'og:type', meta.type ?? 'website');
  html = setMeta(html, 'property', 'og:url', url);
  html = setMeta(html, 'property', 'og:title', meta.title);
  html = setMeta(html, 'property', 'og:description', meta.description);
  html = setMeta(html, 'property', 'og:image', image.url);
  html = setMeta(html, 'property', 'og:image:width', String(image.width ?? ''));
  html = setMeta(html, 'property', 'og:image:height', String(image.height ?? ''));
  html = setMeta(html, 'property', 'og:image:alt', image.alt ?? '');
  html = setMeta(html, 'name', 'twitter:title', meta.title);
  html = setMeta(html, 'name', 'twitter:description', meta.description);
  html = setMeta(html, 'name', 'twitter:image', image.url);

  // 홈의 LocalBusiness 구조화 데이터에 남은 상대 주소도 같이 완성한다
  html = html.replace(/"(url|image|logo)": "\/(og-image\.jpg|favicon\.png|)"/g, `"$1": "${origin}/$2"`);

  const extra = [];
  if (meta.article) {
    extra.push(`<meta property="article:published_time" content="${escapeHtml(meta.article.published)}" />`);
    if (meta.article.modified) {
      extra.push(`<meta property="article:modified_time" content="${escapeHtml(meta.article.modified)}" />`);
    }
    if (meta.article.section) {
      extra.push(`<meta property="article:section" content="${escapeHtml(meta.article.section)}" />`);
    }
  }
  if (meta.jsonLd) {
    // </script> 가 데이터에 들어 있어도 태그가 닫히지 않게 < 를 이스케이프
    const json = JSON.stringify(meta.jsonLd).replace(/</g, '\\u003c');
    extra.push(`<script type="application/ld+json">${json}</script>`);
  }
  if (extra.length) html = html.replace('</head>', `    ${extra.join('\n    ')}\n  </head>`);
  return html;
}

/** 게시판 글 한 편의 메타. 제목·설명 규칙은 src/data/seo.ts postMeta 와 같다. */
export function postMeta(post, origin) {
  const url = `${origin}/board/${post.slug}`;
  const description = clip(post.summary || markdownToText(post.body), 160);
  const first = post.images[0];
  const image = first
    ? { url: `${origin}/api/images/${first.id}`, width: first.width, height: first.height, alt: first.alt || post.title }
    : undefined;
  const modified = post.updated_at ? new Date(post.updated_at).toISOString() : undefined;

  return {
    origin,
    path: `/board/${post.slug}`,
    title: `${post.title} | ${SITE_NAME}`,
    description,
    type: 'article',
    image,
    article: { published: post.date, modified, section: post.category },
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description,
      inLanguage: 'ko',
      datePublished: post.date,
      ...(modified ? { dateModified: modified } : {}),
      mainEntityOfPage: url,
      ...(post.images.length
        ? { image: post.images.map((i) => `${origin}/api/images/${i.id}`) }
        : { image: [`${origin}/og-image.jpg`] }),
      author: { '@type': 'Organization', name: SITE_NAME, url: `${origin}/` },
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        logo: { '@type': 'ImageObject', url: `${origin}/favicon.png` },
      },
    },
  };
}

export function notFoundMeta(origin, path, title = '페이지를 찾을 수 없습니다') {
  return {
    origin,
    path,
    title: `${title} | ${SITE_NAME}`,
    description: '주소가 바뀌었거나 삭제된 페이지입니다.',
    robots: 'noindex, nofollow',
  };
}

export function sitemapXml(routes, posts, origin) {
  const entries = [
    ...routes.map((r) => ({ loc: `${origin}${r.path}` })),
    ...posts.map((p) => ({
      loc: `${origin}/board/${p.slug}`,
      lastmod: p.updated_at ? new Date(p.updated_at).toISOString().slice(0, 10) : p.date,
    })),
  ];
  const body = entries
    .map(
      (e) =>
        `  <url>\n    <loc>${escapeHtml(e.loc)}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ''}\n  </url>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

/** /api/ 는 막되 글 사진(/api/images/)은 열어 둔다 — 이미지 검색과 공유 카드가 읽어야 한다. */
export function robotsTxt(origin) {
  return ['User-agent: *', 'Disallow: /admin', 'Disallow: /api/', 'Allow: /api/images/', '', `Sitemap: ${origin}/sitemap.xml`, ''].join('\n');
}
