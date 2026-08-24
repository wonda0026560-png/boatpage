import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
// 인도된 어장관리선 두 척이 나란히 계류된 장면.
import heroImage from '../../../assets/site/hero-two-boats.jpg';

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
          '.hero__fallback',
          { scale: 1.1 },
          { scale: 1, duration: 1.8, ease: 'power3.out' },
          0
        );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="hero" id="top">
      {/*
        첫 화면 배경이라 지연 로딩하지 않는다. fetchPriority로 우선순위를 올려
        타이틀과 함께 바로 그려지게 한다.
      */}
      <img
        className="hero__fallback"
        src={heroImage}
        alt="완도 앞바다에 나란히 계류된 원다마린산업 어장관리선 두 척"
        fetchPriority="high"
        decoding="async"
      />
      <div className="hero__overlay" />

      <div className="hero__topline">
        <span>전라남도 완도 · FRP 선박 건조</span>
        <span>1994년 원다조선소에서 시작</span>
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
          완도에서 직접 성형하고 의장하는 FRP 낚시·레저보트.
          30년 넘게 지어 온 조업선의 경험이 모든 레저 모델 뒤에 있습니다.
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

      <div className="hero__scroll">아래로 내려 라인업 보기 ↓</div>
    </section>
  );
}