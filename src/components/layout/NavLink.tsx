import { useHref, useLocation, useNavigate } from 'react-router-dom';
import type { MouseEvent, ReactNode } from 'react';
import { scrollToAnchor, setPendingAnchor } from '../../hooks/useSmoothScroll';

interface NavLinkProps {
  /** '/models' 같은 라우트, 또는 '/#about' 같은 홈 섹션 앵커 */
  to: string;
  children: ReactNode;
  className?: string;
  onNavigate?: () => void;
}

/**
 * 라우트 이동과 홈 섹션 앵커를 한 컴포넌트에서 처리한다.
 *
 * 세 가지 경우가 있다.
 *  1. 홈에 있고 홈 앵커      → Lenis로 부드럽게 스크롤 (라우팅 없음)
 *  2. 다른 페이지에서 홈 앵커 → '/'로 이동시키고, 홈이 준비되면 그 섹션으로
 *  3. 일반 라우트            → 이동 후 최상단
 */
export default function NavLink({ to, children, className, onNavigate }: NavLinkProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const hashIndex = to.indexOf('#');
  const isHomeAnchor = hashIndex !== -1;
  const anchorId = isHomeAnchor ? to.slice(hashIndex + 1) : '';
  const path = isHomeAnchor ? to.slice(0, hashIndex) || '/' : to;

  /*
    href 에는 basename 이 붙은 실제 주소를 넣는다.
    GitHub Pages 프로젝트 사이트처럼 하위 경로(/boatpage/)로 서비스될 때,
    raw 경로를 그대로 두면 ⌘+클릭·새 탭 열기·주소 복사·크롤러가 전부
    basename 없는 주소로 향해 404 가 된다. 일반 클릭은 아래 onClick 이
    가로채므로 눈에 띄지 않다가 저 경로들에서만 터진다.
  */
  const resolvedPath = useHref(path);
  const href = isHomeAnchor ? `${resolvedPath}#${anchorId}` : resolvedPath;

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // 새 탭으로 열기 등 브라우저 기본 동작은 건드리지 않는다.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate?.();

    if (!isHomeAnchor) {
      navigate(to);
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    if (location.pathname === path) {
      const target = document.getElementById(anchorId);
      if (target) scrollToAnchor(target);
      return;
    }

    // 목적지를 넘겨두고 홈으로. 홈의 useSmoothScroll이 마운트 후 꺼내 쓴다.
    setPendingAnchor(anchorId);
    navigate(path);
  };

  return (
    <a href={href} className={className} onClick={handleClick} data-cursor="expand">
      {children}
    </a>
  );
}
