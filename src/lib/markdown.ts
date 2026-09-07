/**
 * 게시판 본문용 마크다운. 칼럼 한 편에 필요한 만큼만 지원한다.
 *
 *   ## 소제목 / ### 작은 소제목      (# 하나짜리는 제목(H1)이 글 제목이므로 H2 로 내린다)
 *   **굵게**  *기울임*  `코드`
 *   [글자](/models/wls560)  또는 주소를 그대로 적으면 링크
 *   - 목록   1. 번호 목록
 *   > 인용
 *
 * 문단은 빈 줄로 나누고, 문단 안의 한 줄 개행은 그대로 줄바꿈이 된다.
 * HTML 은 해석하지 않는다 — 글자로 그대로 나온다.
 *
 * 서버(server/seo.js)에도 검색 설명용 평문 변환이 따로 있다. 문법을 바꾸면 거기도 맞춘다.
 */

export type Inline =
  | { type: 'text'; text: string }
  | { type: 'strong'; children: Inline[] }
  | { type: 'em'; children: Inline[] }
  | { type: 'code'; text: string }
  | { type: 'link'; href: string; children: Inline[] }
  | { type: 'br' };

export type Block =
  | { type: 'heading'; level: 2 | 3; children: Inline[] }
  | { type: 'paragraph'; children: Inline[] }
  | { type: 'list'; ordered: boolean; items: Inline[][] }
  | { type: 'quote'; children: Inline[] };

const HEADING_RE = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
const BULLET_RE = /^[-*]\s+(.*)$/;
const NUMBERED_RE = /^\d+[.)]\s+(.*)$/;
const QUOTE_RE = /^>\s?(.*)$/;

/*
  인라인 요소를 한 정규식으로 찾는다. 왼쪽에서 가장 먼저 나오는 것이 이기고,
  같은 자리면 위에 적힌 순서대로다 — `**` 가 `*` 보다 앞에 있어야 굵게가
  기울임 두 개로 쪼개지지 않는다.
*/
const INLINE_RE =
  /\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s<>()]+[^\s<>().,!?;:'"])/g;

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  /*
    matchAll 은 정규식을 복제해서 돈다. 굵게 안의 링크처럼 재귀로 다시 들어올 때
    exec() 로 lastIndex 를 공유하면 바깥 루프가 같은 자리를 무한히 다시 읽는다.
  */
  for (const m of text.matchAll(INLINE_RE)) {
    if (m.index > last) pushText(out, text.slice(last, m.index));
    if (m[1] !== undefined) out.push({ type: 'strong', children: parseInline(m[1]) });
    else if (m[2] !== undefined) out.push({ type: 'em', children: parseInline(m[2]) });
    else if (m[3] !== undefined) out.push({ type: 'code', text: m[3] });
    else if (m[4] !== undefined) out.push({ type: 'link', href: m[5], children: parseInline(m[4]) });
    else if (m[6] !== undefined) out.push({ type: 'link', href: m[6], children: [{ type: 'text', text: m[6] }] });
    last = m.index + m[0].length;
  }
  if (last < text.length) pushText(out, text.slice(last));
  return out;
}

/** 여러 줄짜리 문단. 줄 사이에 <br> 을 넣는다. */
function parseLines(lines: string[]): Inline[] {
  const out: Inline[] = [];
  lines.forEach((line, i) => {
    if (i > 0) out.push({ type: 'br' });
    out.push(...parseInline(line));
  });
  return out;
}

function pushText(out: Inline[], text: string) {
  const prev = out[out.length - 1];
  if (prev && prev.type === 'text') prev.text += text;
  else out.push({ type: 'text', text });
}

export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let quote: string[] = [];
  let list: { ordered: boolean; items: Inline[][] } | null = null;

  const flush = () => {
    if (paragraph.length) blocks.push({ type: 'paragraph', children: parseLines(paragraph) });
    if (quote.length) blocks.push({ type: 'quote', children: parseLines(quote) });
    if (list) blocks.push({ type: 'list', ...list });
    paragraph = [];
    quote = [];
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flush();
      continue;
    }

    const heading = HEADING_RE.exec(line);
    if (heading) {
      flush();
      blocks.push({
        type: 'heading',
        level: heading[1].length <= 2 ? 2 : 3,
        children: parseInline(heading[2]),
      });
      continue;
    }

    const bullet = BULLET_RE.exec(line) ?? NUMBERED_RE.exec(line);
    if (bullet) {
      const ordered = NUMBERED_RE.test(line);
      if (!list || list.ordered !== ordered) {
        flush();
        list = { ordered, items: [] };
      }
      list.items.push(parseInline(bullet[1]));
      continue;
    }

    const quoted = QUOTE_RE.exec(line);
    if (quoted) {
      if (paragraph.length || list) flush();
      quote.push(quoted[1]);
      continue;
    }

    // 목록·인용 바로 다음 줄에 붙은 글은 그 항목의 이어지는 줄로 본다
    if (list) {
      const items = list.items;
      items[items.length - 1].push({ type: 'br' }, ...parseInline(line.trim()));
      continue;
    }
    if (quote.length) {
      quote.push(line.trim());
      continue;
    }
    paragraph.push(line.trim());
  }
  flush();
  return blocks;
}

/** 검색 설명·미리보기용 평문. 문법 기호를 벗기고 한 줄로 만든다. */
export function markdownToText(source: string): string {
  return source
    .replace(/\r\n/g, '\n')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*(?:[-*]|\d+[.)])\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|\*|`)(.+?)\1/g, '$2')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 본문에 든 소제목만 뽑는다. 편집기의 구조 점검에 쓴다. */
export function headings(source: string): { level: 2 | 3; text: string }[] {
  return parseMarkdown(source)
    .filter((b): b is Extract<Block, { type: 'heading' }> => b.type === 'heading')
    .map((b) => ({ level: b.level, text: inlineToText(b.children) }));
}

export function inlineToText(nodes: Inline[]): string {
  return nodes
    .map((n) => {
      switch (n.type) {
        case 'text':
        case 'code':
          return n.text;
        case 'br':
          return ' ';
        default:
          return inlineToText(n.children);
      }
    })
    .join('');
}
