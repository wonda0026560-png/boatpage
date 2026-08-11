import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Cursor from '../../components/layout/Cursor';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import NavLink from '../../components/layout/NavLink';
import { useSmoothScroll } from '../../hooks/useSmoothScroll';
import { FAQ_GROUPS } from '../../data/faq';

gsap.registerPlugin(ScrollTrigger);

export default function FaqPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  // 한 번에 하나만 펼친다. 'g0-2' 같은 키로 그룹과 항목을 함께 식별한다.
  const [openKey, setOpenKey] = useState<string | null>(null);
  useSmoothScroll();

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        gsap.set('.faq-group', { opacity: 1, y: 0 });
        return;
      }

      gsap.from('.faq-head__title span', {
        yPercent: 115,
        duration: 1.1,
        ease: 'power4.out',
      });

      gsap.utils.toArray<HTMLElement>('.faq-group').forEach((group) => {
        gsap.fromTo(
          group,
          { opacity: 0, y: 56 },
          {
            opacity: 1,
            y: 0,
            duration: 0.85,
            ease: 'power3.out',
            scrollTrigger: { trigger: group, start: 'top 85%' },
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

      <main className="faq">
        <header className="faq-head">
          <p className="faq-head__eyebrow">전라남도 완도 · FRP 선박 건조</p>
          <h1 className="faq-head__title">
            <span className="faq-head__line">
              <span>FAQ</span>
            </span>
          </h1>
          <p className="faq-head__body">
            주문 전에 가장 많이 받는 질문을 모았습니다. 찾으시는 답이 없으면
            메일로 문의해 주세요. 실제 사용 계획을 알려주시면 그에 맞춰 안내해 드리겠습니다.
          </p>
        </header>

        <div className="faq-groups">
          {FAQ_GROUPS.map((group, gi) => (
            <section className="faq-group" key={group.title}>
              <div className="faq-group__head">
                <span className="faq-group__index">{group.index}</span>
                <h2 className="faq-group__title">{group.title}</h2>
              </div>

              <dl className="faq-list">
                {group.items.map((item, ii) => {
                  const key = `g${gi}-${ii}`;
                  const isOpen = openKey === key;
                  return (
                    <div className={`faq-item${isOpen ? ' is-open' : ''}`} key={item.q}>
                      <dt>
                        <button
                          type="button"
                          className="faq-item__q"
                          aria-expanded={isOpen}
                          aria-controls={`${key}-answer`}
                          onClick={() => setOpenKey(isOpen ? null : key)}
                          data-cursor="expand"
                        >
                          <span className="faq-item__q-text">{item.q}</span>
                          <span className="faq-item__sign" aria-hidden="true" />
                        </button>
                      </dt>
                      {/*
                        grid-template-rows 0fr → 1fr 로 여닫는다.
                        높이를 재지 않아도 되고 내용 길이에 상관없이 부드럽다.
                      */}
                      <dd id={`${key}-answer`} className="faq-item__a" role="region">
                        <div className="faq-item__a-inner">
                          <p>{item.a}</p>
                        </div>
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          ))}
        </div>

        <aside className="faq-cta">
          <h2 className="faq-cta__title">
            더 궁금한 점이 있으신가요<span className="faq-cta__dot">?</span>
          </h2>
          <div className="faq-cta__links">
            <a
              href="mailto:wonda0026@kakao.com"
              className="faq-cta__link tlink"
              data-cursor="expand"
            >
              wonda0026@kakao.com →
            </a>
            <NavLink to="/models" className="faq-cta__link tlink">
              모델 라인업 보기 →
            </NavLink>
          </div>
        </aside>
      </main>

      <Footer />
    </div>
  );
}
