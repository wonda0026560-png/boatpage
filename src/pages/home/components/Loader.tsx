import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface LoaderProps {
  onComplete: () => void;
}

export default function Loader({ onComplete }: LoaderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  // onComplete는 호출부에서 인라인 화살표로 넘어와 매 렌더마다 새 함수가 된다.
  // 이걸 그대로 의존성에 두면 부모가 리렌더될 때마다 로더가 처음부터 다시 돈다.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useLayoutEffect(() => {
    document.body.classList.add('is-loading');
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          document.body.classList.remove('is-loading');
          onCompleteRef.current();
        },
      });

      if (prefersReduced) {
        gsap.set(rootRef.current, { display: 'none' });
        tl.set({}, {}, 0);
        return;
      }

      tl.to(titleRef.current, {
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out',
      })
        .to(
          barRef.current,
          {
            scaleX: 1,
            duration: 1.4,
            ease: 'power2.inOut',
          },
          '-=0.4'
        )
        .to(
          rootRef.current,
          {
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
            duration: 1.2,
            ease: 'power3.inOut',
          },
          '+=0.2'
        )
        .set(rootRef.current, { display: 'none' });
    }, rootRef);

    return () => {
      ctx.revert();
      document.body.classList.remove('is-loading');
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="loader"
      style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' }}
    >
      <div ref={titleRef} className="loader__title">
        원다마린산업
      </div>
      <div className="loader__bar" aria-hidden="true">
        <span ref={barRef} />
      </div>
    </div>
  );
}