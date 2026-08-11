import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** 고정 헤더 높이. 앵커 도착 지점이 헤더에 가리지 않도록 보정한다. */
export const HEADER_OFFSET = 80;

/**
 * 라우트 이동 뒤에 처리해야 할 앵커를 잠시 보관한다.
 *
 * 서브페이지에서 홈 섹션 링크를 누르면 먼저 `/`로 라우팅되는데, 그 시점엔
 * 목적지 섹션이 아직 마운트되지 않았다. 홈이 스크롤을 붙잡을 준비가 되면
 * consumePendingAnchor()로 꺼내 쓴다.
 */
let pendingAnchor: string | null = null;

export function setPendingAnchor(id: string) {
  pendingAnchor = id;
}

function consumePendingAnchor() {
  const id = pendingAnchor;
  pendingAnchor = null;
  return id;
}

/** 현재 살아있는 Lenis 인스턴스. NavLink가 부드러운 스크롤에 쓴다. */
let activeLenis: Lenis | null = null;

export function getLenis() {
  return activeLenis;
}

/** 헤더 높이를 보정한 목적지의 문서 기준 Y 좌표. */
export function anchorTop(target: HTMLElement) {
  return target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
}

/**
 * 앵커로 이동한다. Lenis가 살아있으면 반드시 Lenis를 거쳐야 한다 —
 * 브라우저 기본 해시 점프는 scrollTop만 바꿀 뿐 Lenis의 내부 위치를
 * 갱신하지 않아, 다음 프레임에 Lenis가 옛 위치로 되돌려버린다.
 */
export function scrollToAnchor(target: HTMLElement, immediate = false) {
  const lenis = activeLenis;
  if (lenis) {
    lenis.scrollTo(target, {
      offset: -HEADER_OFFSET,
      duration: immediate ? 0 : 1.2,
      immediate,
    });
    return;
  }
  window.scrollTo({ top: anchorTop(target), behavior: immediate ? 'auto' : 'smooth' });
}

/** 클릭 이벤트가 같은 페이지 앵커 링크인 경우 목적지 엘리먼트를 돌려준다. */
function resolveAnchorTarget(e: MouseEvent): HTMLElement | null {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
    return null;
  }
  const anchor = (e.target as HTMLElement | null)?.closest?.('a');
  if (!anchor) return null;

  const href = anchor.getAttribute('href');
  if (!href || !href.startsWith('#') || href === '#') return null;

  return document.getElementById(href.slice(1));
}

interface Options {
  /** 로더가 끝나기 전에는 스크롤을 붙잡지 않는다. */
  enabled?: boolean;
}

/**
 * Lenis 스무스 스크롤 + ScrollTrigger 연동 + 앵커 처리.
 *
 * 홈과 서브페이지가 같은 스크롤 거동을 갖도록 공용 훅으로 뺐다.
 * prefers-reduced-motion이면 Lenis를 띄우지 않고 즉시 점프만 처리한다.
 */
export function useSmoothScroll({ enabled = true }: Options = {}) {
  const { pathname } = useLocation();

  /*
    라우트가 바뀌면 문서 최상단에서 시작한다.

    react-router는 스크롤 위치를 건드리지 않아, 목록 중간에서 상세로 들어가면
    상세 페이지도 같은 높이에서 열린다. Lenis 인스턴스가 만들어지기 전에
    (useEffect보다 먼저 도는 useLayoutEffect에서) 0으로 맞춰야 새 Lenis가
    0을 시작 위치로 읽는다.

    앵커로 넘어온 이동은 목적지가 따로 있으므로 건드리지 않는다.
  */
  useLayoutEffect(() => {
    if (pendingAnchor) return;
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;

    // 라우트 이동으로 넘어온 앵커가 있으면, 레이아웃이 잡힌 뒤 그 자리로 보낸다.
    const runPending = () => {
      const id = consumePendingAnchor();
      if (!id) return;
      const target = document.getElementById(id);
      if (target) scrollToAnchor(target, true);
    };

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      ScrollTrigger.refresh();
      const onClick = (e: MouseEvent) => {
        const target = resolveAnchorTarget(e);
        if (!target) return;
        e.preventDefault();
        window.scrollTo({ top: anchorTop(target), behavior: 'auto' });
        ScrollTrigger.refresh();
      };
      document.addEventListener('click', onClick);
      const pendingTimer = window.setTimeout(runPending, 100);
      return () => {
        window.clearTimeout(pendingTimer);
        document.removeEventListener('click', onClick);
      };
    }

    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    activeLenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);

    const onClick = (e: MouseEvent) => {
      const target = resolveAnchorTarget(e);
      if (!target) return;
      e.preventDefault();
      scrollToAnchor(target);
    };
    document.addEventListener('click', onClick);

    const rafCallback = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(rafCallback);
    gsap.ticker.lagSmoothing(0);

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener('resize', onResize);

    const refreshTimer = window.setTimeout(() => {
      ScrollTrigger.refresh();
      runPending();
    }, 400);

    return () => {
      window.clearTimeout(refreshTimer);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('click', onClick);
      gsap.ticker.remove(rafCallback);
      lenis.destroy();
      if (activeLenis === lenis) activeLenis = null;
    };
  }, [enabled]);
}
