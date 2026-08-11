import { useEffect, useRef } from 'react';

export default function Cursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isCoarse = window.matchMedia('(pointer: coarse)').matches;
    const isNarrow = window.innerWidth < 900;
    if (isCoarse || isNarrow) return;

    const el = cursorRef.current;
    if (!el) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currX = mouseX;
    let currY = mouseY;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const expand = target.closest(
        'a, button, [data-cursor="expand"], .bento__card, img, .tlink'
      );
      if (expand) {
        el.classList.add('is-expand');
      } else {
        el.classList.remove('is-expand');
      }
    };

    const tick = () => {
      currX += (mouseX - currX) * 0.18;
      currY += (mouseY - currY) * 0.18;
      el.style.transform = `translate(${currX}px, ${currY}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={cursorRef} className="cursor" aria-hidden="true">
      {/*
        위치는 JS가 래퍼의 transform으로 잡는다. 확대/기울기는 안쪽 SVG에서
        처리해야 매 프레임 덮어쓰이는 래퍼 transform과 충돌하지 않는다.
      */}
      <svg className="cursor__boat" viewBox="0 0 32 32">
        {/*
          선체. 갑판선이 선저보다 앞뒤로 튀어나오되 선수(오른쪽) 쪽이 더 길다.
          좌우 대칭이면 뱃머리가 어느 쪽인지 읽히지 않아 방향을 비대칭으로 준다.
        */}
        <path d="M2.5 16.4 H30.5 L25.5 23.2 Q15.5 25.9 5.5 23.2 Z" />
        {/* 콘솔. 전면창을 선수 쪽으로 눕혀 진행 방향을 한 번 더 보여준다. */}
        <path d="M12.4 16.4 V10.8 H17.4 L19.6 13.6 V16.4 Z" />
      </svg>
    </div>
  );
}