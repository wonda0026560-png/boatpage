import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/*
  ⚠️ 아래 image 주소는 아직 리조트 스톡 사진입니다.
  실제 작업장·시운전 사진으로 교체해야 합니다. alt는 교체될 사진 기준으로 적어두었습니다.
*/
const PANELS = [
  {
    num: '01',
    title: 'Moulding',
    sub: 'FRP laid up by hand, in our own moulds.',
    image:
      'https://images.unsplash.com/photo-1569748133568-b68f8812723a?w=2400&q=75&fm=jpg&fit=crop&auto=format',
    alt: '깊은 바다 위를 항주하는 흰색 보트',
  },
  {
    num: '02',
    title: 'Fit-Out',
    sub: 'Console, seating and live wells set to how you fish.',
    image:
      'https://images.unsplash.com/photo-1575224639551-12afa3e701d9?w=2400&q=75&fm=jpg&fit=crop&auto=format',
    alt: '사람들을 태우고 선회하는 레저보트',
  },
  {
    num: '03',
    title: 'Sea Trial',
    sub: 'Every hull runs before it leaves Wando.',
    image:
      'https://images.unsplash.com/photo-1593351415075-3bac9f45c877?w=2400&q=75&fm=jpg&fit=crop&auto=format',
    alt: '해질 무렵 시운전 중인 레저보트',
  },
];

export default function StackedPanels() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const isNarrow = window.innerWidth <= 760;
      if (prefersReduced || isNarrow) return;

      const panels = gsap.utils.toArray<HTMLElement>('.stacked__panel');
      panels.forEach((panel, i) => {
        if (i === panels.length - 1) return;
        gsap.to(panel, {
          scale: 0.92,
          y: -28,
          filter: 'brightness(0.45)',
          ease: 'none',
          scrollTrigger: {
            trigger: panel,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
            pin: true,
            pinSpacing: false,
          },
        });
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="stacked" id="process" aria-label="How we build">
      {PANELS.map((p) => (
        <article className="stacked__panel" key={p.num}>
          <img className="stacked__img" src={p.image} alt={p.alt} />
          <div className="stacked__panel-overlay" />
          <div className="stacked__content">
            <div className="stacked__num">{p.num} — Stage</div>
            <div>
              <h3 className="stacked__title">{p.title}</h3>
              <p className="stacked__sub">{p.sub}</p>
            </div>
            <div className="stacked__footer">
              <span>전라남도 완도 · FRP 선박 건조</span>
              {/*
                이전 값은 #reserve 였는데, 푸터 아이디를 #contact 로 바꾸면서
                가리키는 대상이 사라진 죽은 링크가 되어 있었다.
                홈에서 모델 페이지로 가는 두 번째 경로도 겸한다.
              */}
              <Link to="/models" className="tlink" data-cursor="expand">
                모델 보기 →
              </Link>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}