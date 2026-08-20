/**
 * 게시판 글 목록.
 *
 * 보트쇼 수상, 수출 실적, 신모델 공개처럼 알릴 일이 생기면 여기에 추가한다.
 * 배열 맨 위가 최신 글이다 — 날짜 기준으로 자동 정렬하지 않으니 순서를 지켜 넣는다.
 *
 * 새 글 추가 예시:
 *
 *   {
 *     slug: 'busan-boat-show-2026',        // 주소에 쓰인다. 영문 소문자와 하이픈만.
 *     date: '2026-09-15',                  // YYYY-MM-DD
 *     category: '수상',                     // 아래 POST_CATEGORIES 중 하나
 *     title: '부산국제보트쇼 디자인상 수상',
 *     summary: '목록에 보이는 한 줄 요약입니다.',
 *     body: [
 *       '첫 문단.',
 *       '둘째 문단. 배열에 넣는 만큼 문단이 늘어난다.',
 *     ],
 *   },
 *
 * 사진을 넣으려면 src/assets/posts/ 에 파일을 두고 상단에서 import 한 뒤
 * images: [{ src: 가져온변수, alt: '설명' }] 형태로 넣는다.
 */

export interface PostImage {
  src: string;
  alt: string;
}

export interface Post {
  slug: string;
  /** YYYY-MM-DD */
  date: string;
  category: string;
  title: string;
  summary: string;
  /** 문단 배열. 한 항목이 한 문단이 된다. */
  body: string[];
  images?: PostImage[];
}

/** 목록 상단 필터에 쓰인다. 여기 없는 값을 category 에 넣으면 '전체'에만 잡힌다. */
export const POST_CATEGORIES = ['소식', '수상', '수출', '신모델'] as const;

export const POSTS: Post[] = [
  // 아직 등록된 글이 없습니다. 위 주석의 형식대로 추가하세요.
];

export function getPostBySlug(slug: string | undefined): Post | undefined {
  if (!slug) return undefined;
  return POSTS.find((p) => p.slug === slug);
}

/** 상세 페이지 하단 이전/다음 글. 목록 순서(최신순)를 그대로 따른다. */
export function getAdjacentPosts(slug: string) {
  const i = POSTS.findIndex((p) => p.slug === slug);
  if (i === -1) return { prev: undefined, next: undefined };
  return {
    // 목록이 최신순이므로 배열 앞쪽이 '최신 글', 뒤쪽이 '이전 글'이다.
    newer: i > 0 ? POSTS[i - 1] : undefined,
    older: i < POSTS.length - 1 ? POSTS[i + 1] : undefined,
  };
}

/** 2026-09-15 → 2026. 09. 15. */
export function formatPostDate(date: string) {
  const [y, m, d] = date.split('-');
  return `${y}. ${m}. ${d}`;
}
