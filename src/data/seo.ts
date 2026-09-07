/**
 * 페이지별 검색 제목·설명.
 *
 * 세 곳이 같은 값을 쓴다.
 *   - 각 페이지 컴포넌트 (usePageMeta) — 탭 제목과 description 을 바꾼다
 *   - vite 빌드 (vite.config.ts) — siteRoutes() 를 out/site-routes.json 으로 내보낸다
 *   - 서버 (server/seo.js) — 그 파일을 읽어 크롤러에게 줄 HTML 의 <head> 를 채운다
 *
 * 홈 문구는 index.html 의 것과 같게 유지한다. 크롤러는 index.html 을 먼저 보고,
 * 사람은 SPA 이동 뒤 이 값을 본다 — 둘이 다르면 검색 결과와 탭 제목이 어긋난다.
 */
import { BOAT_MODELS, VIEWABLE_MODELS, type BoatModel } from './models';
import { markdownToText } from '../lib/markdown';

export const SITE_NAME = '원다마린산업';

export interface PageMeta {
  title: string;
  description: string;
}

export interface SiteRoute extends PageMeta {
  path: string;
}

export const HOME_META: PageMeta = {
  title: '원다마린산업 | 어장관리선·낚시보트 제작 — 전라남도 완도',
  description:
    '1994년부터 완도에서 배를 지어 온 원다마린산업입니다. 0.75~14톤 어장관리선을 주문 제작하고, 낚시용 레저보트 WLS560·WLS560-X를 직접 설계·건조합니다. 보트 보관소도 함께 운영합니다.',
};

export const PAGE_META: Record<string, PageMeta> = {
  '/': HOME_META,
  '/models': {
    title: `모델 라인업 — 어장관리선·낚시용 레저보트 | ${SITE_NAME}`,
    description:
      '원다마린산업이 건조하는 배들입니다. 0.75톤급부터 14톤급까지의 어장관리선(선외기·선내기)과 낚시용 레저보트 WLS560·WLS560-X. 3D 뷰어와 실제 인도 사진으로 확인하세요.',
  },
  '/about': {
    title: `기업소개 — 1994년부터 완도에서 | ${SITE_NAME}`,
    description:
      '전라남도 완도 노화도의 FRP 선박 건조 업체 원다마린산업. 어장관리선 주문 제작, 낚시용 레저보트 WLS560 시리즈 설계·건조, 보트 보관소 운영. 공장과 전시장 안내.',
  },
  '/board': {
    title: `게시판 — 소식·수상·수출·신모델 | ${SITE_NAME}`,
    description:
      '원다마린산업의 소식. 보트쇼 수상, 해외 수출, 신모델 개발과 진수 소식을 전합니다.',
  },
};

/** 검색 결과에 잘리지 않을 만한 길이로 자른다. 단어 중간에서 끊지 않는다. */
export function clip(text: string, max: number) {
  const t = text.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return `${space > max * 0.6 ? cut.slice(0, space) : cut}…`;
}

export function modelMeta(model: BoatModel): PageMeta {
  const name = model.suffix ? `${model.name} ${model.suffix}` : model.name;
  const specs = model.specs.map((s) => `${s.label} ${s.value}`).join(' · ');
  const body = model.description || model.tagline;
  return {
    title: `${name} — ${model.type} | ${SITE_NAME}`,
    description: clip(specs ? `${body} ${specs}.` : body, 160),
  };
}

/** 게시판 글. 서버(server/seo.js postMeta)와 같은 규칙이어야 한다. */
export function postMeta(post: { title: string; summary: string; body: string }): PageMeta {
  return {
    title: `${post.title} | ${SITE_NAME}`,
    description: clip(post.summary || markdownToText(post.body), 160),
  };
}

/** 빌드 시 사이트맵·서버용으로 내보내는 고정 경로 목록. 게시판 글은 서버가 DB 에서 더한다. */
export function siteRoutes(): SiteRoute[] {
  const fixed = Object.entries(PAGE_META).map(([path, meta]) => ({ path, ...meta }));
  const models = BOAT_MODELS.filter((m) => VIEWABLE_MODELS.includes(m)).map((m) => ({
    path: `/models/${m.slug}`,
    ...modelMeta(m),
  }));
  return [...fixed, ...models];
}
