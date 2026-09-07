import { useEffect } from 'react';
import type { PageMeta } from '../data/seo';

/**
 * SPA 안에서 페이지를 옮길 때 탭 제목과 description 을 맞춘다.
 *
 * 크롤러용 <head> 는 서버(server/seo.js)가 첫 응답에 이미 채워 두므로,
 * 여기서는 사람이 보는 탭 제목과 뒤로가기 기록, 그리고 JS 렌더 뒤 다시 읽는
 * 크롤러를 위해 같은 값을 한 번 더 써 둔다. 되돌리지 않는다 — 다음 페이지가
 * 자기 값을 쓴다.
 */
export function usePageMeta(meta: PageMeta | null | undefined) {
  useEffect(() => {
    if (!meta) return;
    document.title = meta.title;
    setContent('meta[name="description"]', meta.description);
    setContent('meta[property="og:title"]', meta.title);
    setContent('meta[property="og:description"]', meta.description);
    setContent('meta[name="twitter:title"]', meta.title);
    setContent('meta[name="twitter:description"]', meta.description);
  }, [meta?.title, meta?.description]); // eslint-disable-line react-hooks/exhaustive-deps
}

function setContent(selector: string, value: string) {
  const el = document.head.querySelector<HTMLMetaElement>(selector);
  if (el) el.content = value;
}
