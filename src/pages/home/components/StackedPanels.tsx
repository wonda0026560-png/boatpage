import { useLayoutEffect, useRef } from 'react';
// 성형: 완도 공장 / 의장: 야드에 거치된 9.77톤급 / 시운전: 1.90톤급
import factoryFront from '../../../assets/site/factory-front.jpg';
import fitOutYard from '../../../assets/boats/fm-977.jpg';
import seaTrial from '../../../assets/boats/fm-190.jpg';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const PANELS = [
  {
    num: '01',
    title: 'Moulding',
    sub: '자체 몰드에 손으로 적층하는 FRP 성형.',
    image: factoryFront,
    alt: 'FRP 성형이 이루어지는 원다마린산업 공장',
  },
  {
    num: '02',
    title: 'Fit-Out',
    sub: '콘솔·좌석·활어창을 조업 방식에 맞춰 배치합니다.',
    image: fitOutYard,
    alt: '야드에서 의장 중인 9.77톤급 어장관리선',
  },
  {
    num: '03',
    title: 'Sea Trial',
    sub: '모든 선체는 완도 앞바다에서 시운전을 거쳐 인도됩니다.',
    image: seaTrial,
    alt: '완도 앞바다에 계류된 1.90톤급 어장관리선',
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
        const dim = panel.querySelector('.stacked__dim');

        /*
          시작값을 fromTo 로 못박는다.

          예전에는 gsap.to(panel, { filter: 'brightness(0.45)' }) 였는데,
          패널의 계산된 filter 가 none 이라 GSAP 이 brightness 성분을 찾지 못하고
          0(완전한 검정)에서 출발시켰다. 핀이 걸리는 순간 화면이 새까매졌다가
          스크롤할수록 오히려 밝아지는, 의도와 정반대 동작이었다.

          어둡게 하는 일은 filter 대신 검은 레이어의 opacity 로 처리한다.
          filter 는 매 프레임 전체를 다시 그리지만 opacity 는 합성만 하면 된다.
        */
        gsap
          .timeline({
            scrollTrigger: {
              trigger: panel,
              start: 'top top',
              end: 'bottom top',
              scrub: true,
              pin: true,
              pinSpacing: false,
              // 부드러운 스크롤에서 핀이 한 프레임 늦게 걸리며 튀는 것을 막는다
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          })
          .fromTo(panel, { scale: 1, y: 0 }, { scale: 0.92, y: -28, ease: 'none' }, 0)
          .fromTo(dim, { opacity: 0 }, { opacity: 0.55, ease: 'none' }, 0);
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
            <div className="stacked__num">{p.num} — 공정</div>
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
          {/* 뒤로 물러나는 패널을 덮는 어둠. 글자까지 함께 어두워지도록 내용 위에 둔다. */}
          <div className="stacked__dim" aria-hidden="true" />
        </article>
      ))}
    </section>
  );
}