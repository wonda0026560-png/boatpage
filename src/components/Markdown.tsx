import { Fragment, type ReactNode } from 'react';
import NavLink from './layout/NavLink';
import { parseMarkdown, type Block, type Inline } from '../lib/markdown';

/**
 * 게시판 본문 렌더러. 마크다운을 React 요소로 바로 그린다 —
 * innerHTML 을 거치지 않으므로 본문에 HTML 이 섞여 들어와도 그대로 글자다.
 *
 * 사이트 안 주소(/models/wls560 처럼 / 로 시작)는 NavLink 로 그려
 * 페이지 전체를 다시 불러오지 않고 이동한다. 바깥 주소는 새 탭.
 */
export default function Markdown({ source, className }: { source: string; className?: string }) {
  const blocks = parseMarkdown(source);
  return <div className={className}>{blocks.map((b, i) => renderBlock(b, i))}</div>;
}

function renderBlock(block: Block, key: number): ReactNode {
  switch (block.type) {
    case 'heading': {
      const Tag = block.level === 2 ? 'h2' : 'h3';
      return <Tag key={key}>{renderInline(block.children)}</Tag>;
    }
    case 'paragraph':
      return <p key={key}>{renderInline(block.children)}</p>;
    case 'quote':
      return (
        <blockquote key={key}>
          <p>{renderInline(block.children)}</p>
        </blockquote>
      );
    case 'list': {
      const Tag = block.ordered ? 'ol' : 'ul';
      return (
        <Tag key={key}>
          {block.items.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </Tag>
      );
    }
  }
}

function renderInline(nodes: Inline[]): ReactNode {
  return nodes.map((n, i) => {
    switch (n.type) {
      case 'text':
        return <Fragment key={i}>{n.text}</Fragment>;
      case 'br':
        return <br key={i} />;
      case 'strong':
        return <strong key={i}>{renderInline(n.children)}</strong>;
      case 'em':
        return <em key={i}>{renderInline(n.children)}</em>;
      case 'code':
        return <code key={i}>{n.text}</code>;
      case 'link':
        return (
          <MarkdownLink key={i} href={n.href}>
            {renderInline(n.children)}
          </MarkdownLink>
        );
    }
  });
}

function MarkdownLink({ href, children }: { href: string; children: ReactNode }) {
  const internal = href.startsWith('/') && !href.startsWith('//');
  if (internal) return <NavLink to={href}>{children}</NavLink>;

  // javascript: 같은 스킴은 링크로 만들지 않는다
  const safe = /^(https?:|mailto:|tel:)/i.test(href);
  if (!safe) return <>{children}</>;

  const external = /^https?:/i.test(href);
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      data-cursor="expand"
    >
      {children}
    </a>
  );
}
