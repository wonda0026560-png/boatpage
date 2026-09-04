/**
 * 게시판 표시용 도우미.
 *
 * 글 자체는 이제 코드가 아니라 Postgres 에 있고, /admin 에서 작성한다.
 * 여기에는 화면과 관리자가 함께 쓰는 상수·포맷 함수만 둔다.
 */

/** 관리자 분류 선택지. 서버(server/index.js)의 CATEGORIES 와 같아야 한다. */
export const POST_CATEGORIES = ['소식', '수상', '수출', '신모델'] as const;

/** 2026-09-15 → 2026. 09. 15 */
export function formatPostDate(date: string) {
  const [y, m, d] = date.split('-');
  return `${y}. ${m}. ${d}`;
}

/** 본문은 빈 줄로 문단을 나눈 평문이다. 한 줄 개행은 문단 안의 줄바꿈으로 남긴다. */
export function splitParagraphs(body: string) {
  return body
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
