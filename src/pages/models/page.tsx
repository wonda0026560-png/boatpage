import { useLayoutEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Cursor from '../../components/layout/Cursor';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { useSmoothScroll } from '../../hooks/useSmoothScroll';
import { BOAT_MODELS } from '../../data/models';

gsap.registerPlugin(ScrollTrigger);

export default function ModelsPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  useSmoothScroll();

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        gsap.set('.model-row', { opacity: 1, y: 0 });
        return;
      }

      gsap.from('.models-head__title span', {
        yPercent: 115,
        duration: 1.1,
        ease: 'power4.out',
        stagger: 0.08,
      });

      gsap.utils.toArray<HTMLElement>('.model-row').forEach((row) => {
        gsap.fromTo(
          row,
          { opacity: 0, y: 64 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: { trigger: row, start: 'top 85%' },
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
      <main className="models">
        <header className="models-head">
          <p className="models-head__eyebrow">전라남도 완도 · FRP 선박 건조</p>
          <h1 className="models-head__title">
            <span className="models-head__line">
              <span>Models</span>
            </span>
          </h1>
          <p className="models-head__body">
            원다마린산업은 합성수지(FRP) 선박과 레저용 보트를 직접 설계하고 건조합니다.
            아래 세 가지가 기본 라인업이며, 선실 구성과 의장은 주문에 맞춰 조정합니다.
          </p>
        </header>

        <div className="model-list">
          {BOAT_MODELS.map((model) => {
            // 개발 중인 모델은 상세 페이지가 없으므로 클릭 대상으로 만들지 않는다.
            const isUpcoming = Boolean(model.upcoming);
            return (
              <article
                key={model.slug}
                className={`model-row${isUpcoming ? ' is-upcoming' : ''}`}
                onClick={isUpcoming ? undefined : () => navigate(`/models/${model.slug}`)}
                data-cursor={isUpcoming ? undefined : 'expand'}
              >
                <div className="model-row__index">{model.index}</div>

                <div className="model-row__main">
                  <h2 className="model-row__name">
                    {model.name}
                    {model.suffix && <span className="model-row__suffix">{model.suffix}</span>}
                  </h2>
                  <p className="model-row__tagline">{model.type}</p>
                </div>

                <dl className="model-row__meta">
                  {model.lengthLabel && (
                    <div>
                      <dt>전장</dt>
                      <dd>{model.lengthLabel}</dd>
                    </div>
                  )}
                </dl>

                {isUpcoming ? (
                  <span className="model-row__badge">개발 중</span>
                ) : (
                  <>
                    <span className="model-row__go" aria-hidden="true">
                      자세히 →
                    </span>
                    {/*
                      카드 전체가 클릭 대상이지만, 키보드/스크린리더용 실제 링크도 남긴다.
                      Link 를 쓰면 basename 이 붙은 href 가 자동으로 생성되어,
                      하위 경로 배포에서도 새 탭 열기·주소 복사가 올바르게 동작한다.
                    */}
                    <Link className="model-row__link" to={`/models/${model.slug}`}>
                      {model.name} 자세히 보기
                    </Link>
                  </>
                )}
              </article>
            );
          })}
        </div>

        <p className="models-note">
          제원은 개선을 위해 예고 없이 변경될 수 있습니다. 정확한 사양과 견적은 문의해 주세요.
        </p>
      </main>
      <Footer />
    </div>
  );
}
