import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Cursor from '../../components/layout/Cursor';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import NavLink from '../../components/layout/NavLink';

gsap.registerPlugin(ScrollTrigger);

/** 본문에 명시된 두 시점. 원문에서 그대로 가져온 것 외에는 넣지 않는다. */
const MILESTONES = [
  { year: '1994', body: '원다조선소, FRP 어장관리선 주력 생산 시작' },
  { year: '2023', body: 'WLS560 개발과 함께 원다마린산업 설립' },
];

const PRODUCTS = [
  {
    index: '01',
    name: 'WLS560',
    type: '센터콘솔형 낚시용 레저보트',
    note: '',
  },
  {
    index: '02',
    name: 'WLS560-X',
    typeSuffix: '(eXtension)',
    type: '캐빈타입 / 선실타입 / 하우스타입 낚시용 레저보트',
    note: 'WLS560 모델 기반에 선실을 탑재한 확장형 모델입니다.',
  },
  {
    index: '03',
    name: 'WLS730',
    type: '개발 중',
    note: '',
    upcoming: true,
  },
];

const WLS560_SPECS = [
  { label: '장', value: '5.65 m' },
  { label: '폭', value: '2.30 m' },
  { label: '심', value: '1.09 m' },
];

export default function AboutPage() {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        gsap.set('.about-block, .about-product', { opacity: 1, y: 0 });
        return;
      }

      gsap.from('.about-head__title span', {
        yPercent: 115,
        duration: 1.1,
        ease: 'power4.out',
      });

      gsap.utils.toArray<HTMLElement>('.about-block, .about-product').forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 56 },
          {
            opacity: 1,
            y: 0,
            duration: 0.85,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 86%' },
          }
        );
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef}>
      <Cursor />
      <Header />

      <main className="about">
        <header className="about-head">
          <p className="about-head__eyebrow">기업소개</p>
          <h1 className="about-head__title">
            <span className="about-head__line">
              <span>About</span>
            </span>
          </h1>
          <p className="about-head__lead">
            원다마린산업은 산업용 디젤엔진을 선박엔진으로 튜닝하여 선박에 장착하는 엔지니어링
            회사로 출발하였으며 1994년 부터 FRP 어장관리선을 주력으로 생산해 온 원다조선소에서
            파생되었습니다. 어선건조업을 기반하여 축적된 기술로, 2023년 낚시보트 WLS560모델
            개발과 함께 레저보트 사업부를 컨셉으로 원다마린산업을 설립하였습니다.
          </p>
        </header>

        <section className="about-block about-timeline" aria-label="연혁">
          {MILESTONES.map((m) => (
            <div className="about-timeline__item" key={m.year}>
              <span className="about-timeline__year">{m.year}</span>
              <span className="about-timeline__body">{m.body}</span>
            </div>
          ))}
        </section>

        <section className="about-block" aria-labelledby="product-intro">
          <p className="about-block__label">제품소개</p>
          <h2 className="about-block__title" id="product-intro">
            삼동선의 장점을<br />
            결합한 선형
          </h2>
          <p className="about-block__body">
            WLS560 모델은 한국 소비자의 요구사항에 최적화된 5M급 낚시용 레저보트를 개발목표로
            추구한 모델입니다. V형 모노헐 양쪽에 너클파트를 추가하여 단동선이지만, 삼동선의
            장점을 결합한 선형입니다. 부상능력과 부력, 롤링에 유리하며, 대형어창의 탑재와 함께
            낚시공간활용성이 뛰어납니다.
          </p>
        </section>

        <section className="about-block" aria-labelledby="product-types">
          <p className="about-block__label">제품 종류</p>
          <h2 className="about-block__title" id="product-types">
            라인업
          </h2>

          <div className="about-products">
            {PRODUCTS.map((p) => (
              <article
                className={`about-product${p.upcoming ? ' is-upcoming' : ''}`}
                key={p.name}
              >
                <span className="about-product__index">{p.index}</span>
                <div className="about-product__main">
                  <h3 className="about-product__name">
                    {p.name}
                    {p.typeSuffix && (
                      <span className="about-product__suffix">{p.typeSuffix}</span>
                    )}
                  </h3>
                  <p className="about-product__type">{p.type}</p>
                  {p.note && <p className="about-product__note">{p.note}</p>}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="about-block about-specs" aria-labelledby="wls560-specs">
          <p className="about-block__label">WLS560 주요제원</p>
          <h2 className="about-block__title" id="wls560-specs">
            WLS560
          </h2>
          <dl className="about-specs__list">
            {WLS560_SPECS.map((s) => (
              <div className="about-specs__row" key={s.label}>
                <dt>{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="about-block" aria-labelledby="wls560x">
          <p className="about-block__label">확장형 모델</p>
          <h2 className="about-block__title" id="wls560x">
            WLS560-X
          </h2>
          <p className="about-block__body">
            WLS560-X(eXtension)는 기존 WLS560 모델의 확장형 버전으로, 한국 소비자의 요구를
            반영하여 더욱 향상된 기능을 제공합니다. WLS560 모델이 갖춘 우수한 횡동요 억제 성능과
            높은 안정성을 그대로 유지하면서, 선실(Cabin)을 추가하여 쾌적성과 활용도를 극대화한
            것이 특징입니다.
          </p>
        </section>

        <aside className="about-cta">
          <h2 className="about-cta__title">
            건조 문의<span className="about-cta__dot">.</span>
          </h2>
          <div className="about-cta__links">
            <a
              href="mailto:wonda0026@kakao.com"
              className="about-cta__link tlink"
              data-cursor="expand"
            >
              wonda0026@kakao.com →
            </a>
            <NavLink to="/faq" className="about-cta__link tlink">
              자주 묻는 질문 →
            </NavLink>
          </div>
        </aside>
      </main>

      <Footer />
    </div>
  );
}
