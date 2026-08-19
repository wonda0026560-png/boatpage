import { useLayoutEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Cursor from '../../components/layout/Cursor';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import NavLink from '../../components/layout/NavLink';
import BoatViewer3D from '../../components/boat/BoatViewer3D';
import { useSmoothScroll } from '../../hooks/useSmoothScroll';
import { getAdjacentModels, getModelBySlug } from '../../data/models';

gsap.registerPlugin(ScrollTrigger);

export default function ModelDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const model = getModelBySlug(slug);
  const [colorIndex, setColorIndex] = useState(0);

  useSmoothScroll();

  useLayoutEffect(() => {
    if (!model) return;
    const ctx = gsap.context(() => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        gsap.set('.spec-row, .detail-copy', { opacity: 1, y: 0 });
        return;
      }
      gsap.from('.detail-hero__name span', {
        yPercent: 115,
        duration: 1.1,
        ease: 'power4.out',
      });
      gsap.utils.toArray<HTMLElement>('.spec-row, .detail-copy').forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%' },
          }
        );
      });
    }, rootRef);
    return () => ctx.revert();
  }, [model]);

  // 색 선택은 모델이 바뀌면 첫 번째로 되돌린다.
  useLayoutEffect(() => setColorIndex(0), [slug]);

  if (!model) {
    return (
      <div>
        <Cursor />
        <Header />
        <main className="detail-missing">
          <h1 className="detail-missing__title">모델을 찾을 수 없습니다</h1>
          <NavLink to="/models" className="tlink detail-missing__back">
            ← 전체 모델 보기
          </NavLink>
        </main>
        <Footer />
      </div>
    );
  }

  const { prev, next } = getAdjacentModels(model.slug);
  const color = model.colors[colorIndex];

  return (
    <div ref={rootRef}>
      <Cursor />
      <Header />

      <main className="detail">
        <nav className="detail-crumb" aria-label="현재 위치">
          <NavLink to="/models" className="tlink">
            모델
          </NavLink>
          <span aria-hidden="true">→</span>
          <span className="detail-crumb__current">{model.name}</span>
        </nav>

        <header className="detail-hero">
          <div className="detail-hero__text">
            <p className="detail-hero__index">{model.index}</p>
            <h1 className="detail-hero__name">
              <span>
                {model.name}
                {model.suffix && <em className="detail-hero__suffix">{model.suffix}</em>}
              </span>
            </h1>
            <p className="detail-hero__tagline">{model.type}</p>
          </div>
          {model.keyFigure && (
            <dl className="detail-hero__figures">
              <div>
                <dt>{model.keyFigure.label}</dt>
                <dd>{model.keyFigure.value}</dd>
              </div>
            </dl>
          )}
        </header>

        {/*
          어선은 실물 사진, 레저보트는 3D 뷰어.
          실제 건조한 배 사진이 있으면 코드로 만든 3D보다 그쪽이 설득력 있다.
        */}
        <section
          className={`detail-viewer${model.photo ? ' detail-viewer--photo' : ''}`}
          aria-label={`${model.name} ${model.photo ? '사진' : '3D 보기'}`}
        >
          {model.photo ? (
            <figure className="detail-photo">
              <img src={model.photo} alt={model.photoAlt ?? model.name} width={1920} height={1440} />
              <figcaption className="detail-photo__caption">
                실제 건조·인도된 선박입니다.
              </figcaption>
            </figure>
          ) : (
            model.hull && (
              <BoatViewer3D hull={model.hull} color={color?.hex ?? '#1B3A57'} modelName={model.name} />
            )
          )}

          {model.colors.length > 0 && color && (
            <div className="detail-colors">
              <h2 className="detail-colors__title">외관 색상</h2>
              <div className="detail-colors__swatches" role="radiogroup" aria-label="외관 색상">
                {model.colors.map((c, i) => (
                  <button
                    key={c.hex}
                    type="button"
                    role="radio"
                    aria-checked={i === colorIndex}
                    aria-label={c.name}
                    title={c.name}
                    className={`detail-colors__swatch${i === colorIndex ? ' is-active' : ''}`}
                    style={{ background: c.hex }}
                    onClick={() => setColorIndex(i)}
                  />
                ))}
              </div>
              <p className="detail-colors__current">{color.name}</p>
              <p className="detail-colors__note">
                위 색상 외에도 원하시는 색으로 주문 제작이 가능합니다.
              </p>
            </div>
          )}
        </section>

        <section className="detail-body">
          <p className="detail-copy">{model.description}</p>

          <div className="detail-specs">
            <h2 className="detail-specs__title">제원</h2>
            {model.specs.length > 0 ? (
              <>
                <dl className="detail-specs__list">
                  {model.specs.map((spec) => (
                    <div className="spec-row" key={spec.label}>
                      <dt>{spec.label}</dt>
                      <dd>{spec.value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="detail-specs__note">
                  제원은 개선을 위해 예고 없이 변경될 수 있습니다.
                </p>
              </>
            ) : (
              /* 값을 지어내느니 없다고 밝히는 편이 낫다 */
              <p className="detail-specs__note">
                상세 제원은 준비 중입니다. 문의해 주시면 안내해 드리겠습니다.
              </p>
            )}
          </div>
        </section>

        <nav className="detail-nav" aria-label="다른 모델">
          {prev && (
            <button
              type="button"
              className="detail-nav__item"
              onClick={() => navigate(`/models/${prev.slug}`)}
              data-cursor="expand"
            >
              <span className="detail-nav__dir">← 이전</span>
              <span className="detail-nav__name">{prev.name}</span>
            </button>
          )}
          {next && (
            <button
              type="button"
              className="detail-nav__item detail-nav__item--next"
              onClick={() => navigate(`/models/${next.slug}`)}
              data-cursor="expand"
            >
              <span className="detail-nav__dir">다음 →</span>
              <span className="detail-nav__name">{next.name}</span>
            </button>
          )}
        </nav>
      </main>

      <Footer />
    </div>
  );
}
