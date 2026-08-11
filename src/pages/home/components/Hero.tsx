import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import HeroCanvas from './HeroCanvas';

const HERO_IMAGE =
  'https://readdy.ai/api/search-image?query=Ultra-realistic%20cinematic%20aerial%20drone%20photograph%20of%20a%20secluded%20emerald%20green%20turquoise%20Caribbean%20cove%20along%20the%20northern%20coast%20of%20Puerto%20Rico%2C%20soft%20warm%20late%20afternoon%20golden%20hour%20light%2C%20pale%20volcanic%20sand%20crescent%20beach%2C%20translucent%20jade%20water%20with%20subtle%20wave%20crests%2C%20lush%20tropical%20jungle%20cliffs%20framing%20the%20cove%2C%20editorial%20luxury%20travel%20magazine%20style%2C%20high%20detail%2C%20muted%20natural%20tones%2C%20soft%20mist%2C%20minimalism&width=2600&height=1600&seq=hero-sanjuan-aerial-01&orientation=landscape';

export default function Hero() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        gsap.set('.hero__title-line span, .hero__sub, .hero__cta, .hero__scroll', {
          y: 0,
          opacity: 1,
        });
        return;
      }

      const tl = gsap.timeline({ delay: 0.2 });
      tl.to('.hero__title-line span', {
        y: 0,
        duration: 1.2,
        ease: 'power3.out',
        stagger: 0.15,
      })
        .to(
          '.hero__sub',
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: 'power2.out',
          },
          '-=0.6'
        )
        .to(
          '.hero__cta',
          {
            opacity: 1,
            duration: 0.8,
            ease: 'power2.out',
          },
          '-=0.6'
        )
        .to(
          '.hero__scroll',
          {
            opacity: 1,
            duration: 0.8,
            ease: 'power2.out',
          },
          '-=0.5'
        )
        .fromTo(
          '.hero__canvas, .hero__fallback',
          { scale: 1.1 },
          { scale: 1, duration: 1.8, ease: 'power3.out' },
          0
        );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="hero" id="top">
      <HeroCanvas imageUrl={HERO_IMAGE} />
      <img
        className="hero__fallback"
        src={HERO_IMAGE}
        alt="완도 앞바다를 항주하는 원다마린산업 레저보트"
      />
      <div className="hero__overlay" />

      <div className="hero__topline">
        <span>FRP Boat Builder · Wando, Korea</span>
        <span>Est. 1994 — Wonda Shipyard</span>
      </div>

      <div className="hero__watermark" aria-hidden="true">
        원다마린산업
      </div>

      <div className="hero__content">
        <h1 className="hero__title">
          <span className="hero__title-line">
            <span>Built</span>
          </span>
          <span className="hero__title-line">
            <span>
              <em className="hero__title-slash" style={{ fontStyle: 'normal' }}>
                /
              </em>
              Since 1994
            </span>
          </span>
        </h1>
        <p className="hero__sub" style={{ transform: 'translateY(20px)' }}>
          FRP fishing and leisure boats, moulded and fitted out by hand in Wando.
          Three decades of working hulls stand behind every leisure model we launch.
        </p>
        {/*
          홈 본문에서 모델 페이지로 들어가는 주 경로.
          이전에는 홈 안쪽 섹션(#experiences)만 가리켜, 3D 뷰어가 있는
          모델 상세로 가는 길이 헤더 메뉴 하나뿐이었다.
        */}
        <Link to="/models" className="hero__cta tlink" data-cursor="expand">
          모델 라인업 보기 →
        </Link>
      </div>

      <div className="hero__scroll">Scroll to the lineup ↓</div>
    </section>
  );
}