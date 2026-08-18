import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const STRIP =
  '© 2026 WONDA MARINE INDUSTRY · 원다마린산업 · WANDO, JEONNAM · FRP BOAT BUILDER · ';

const BUSINESS_INFO = [
  { label: '상호', value: '원다마린산업' },
  { label: '대표자', value: '김도연' },
  { label: '사업자등록번호', value: '847-09-02623' },
  { label: '업태 / 종목', value: '제조업 / 합성수지선 건조업, 오락 및 스포츠용 보트 건조업' },
  // 사업자등록증상 소재지(79)와 공장(137)이 다른 번지라 항목을 나눠 표기한다
  { label: '사업장 소재지', value: '전라남도 완도군 노화읍 노화로831번길 79' },
  { label: '공장', value: '전라남도 완도군 노화읍 노화로831번길 137' },
  { label: '전시장', value: '전라남도 완도군 완도읍 중도리 111-1' },
  { label: '이메일', value: 'wonda0026@kakao.com', href: 'mailto:wonda0026@kakao.com' },
];

export default function Footer() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        gsap.set('.site-footer__inner', { scale: 1, opacity: 1 });
        return;
      }

      gsap.fromTo(
        '.site-footer__inner',
        { scale: 0.9, opacity: 0.5 },
        {
          scale: 1,
          opacity: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top 90%',
            end: 'top 30%',
            scrub: true,
          },
        }
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <footer ref={rootRef} className="site-footer" id="contact">
      <div className="site-footer__inner">
        <a
          href="mailto:wonda0026@kakao.com"
          className="site-footer__cta tlink"
          data-cursor="expand"
        >
          견적 문의하기 →
        </a>
      </div>

      <div className="site-footer__biz">
        <h3 className="site-footer__biz-title">Business Information</h3>
        <dl className="site-footer__biz-list">
          {BUSINESS_INFO.map((row) => (
            <div className="site-footer__biz-row" key={row.label}>
              <dt className="site-footer__biz-label">{row.label}</dt>
              <dd className="site-footer__biz-value">
                {row.href ? (
                  <a href={row.href} className="tlink" data-cursor="expand">
                    {row.value}
                  </a>
                ) : (
                  row.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="site-footer__strip" aria-hidden="true">
        <div className="site-footer__marquee">
          <span>{STRIP.repeat(4)}</span>
          <span>{STRIP.repeat(4)}</span>
        </div>
      </div>
    </footer>
  );
}