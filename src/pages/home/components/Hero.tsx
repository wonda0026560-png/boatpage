import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
// 드론으로 촬영한 항주 영상. 포스터는 영상 첫 프레임이라 전환이 튀지 않는다.
import heroVideo from '../../../assets/video/hero-boat.mp4';
import heroPoster from '../../../assets/video/hero-boat-poster.jpg';

export default function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  /*
    영상은 조건이 맞을 때만 붙인다.
    - 모바일: 데이터도 아깝고 디코딩 부담이 가장 큰 기기라 포스터만 쓴다
    - prefers-reduced-motion: 자동 재생 자체가 접근성 문제라 켜지 않는다
    처음부터 false로 두고 마운트 후 판단해야 서버·클라이언트 첫 페인트가 어긋나지 않는다.
  */
  const [useVideo, setUseVideo] = useState(false);

  useEffect(() => {
    const wide = window.matchMedia('(min-width: 761px)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setUseVideo(wide && !reduced);
  }, []);

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
      {/*
        포스터 이미지는 항상 깔아둔다. 영상이 준비되기 전 첫 페인트를 채우고,
        모바일·감속모션 환경에서는 이것만 남는다.
      */}
      <img
        className="hero__fallback"
        src={heroPoster}
        alt="드론으로 촬영한 원다마린산업 보트의 항주 장면"
      />
      {useVideo && (
        <video
          className="hero__video"
          src={heroVideo}
          poster={heroPoster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
        />
      )}
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