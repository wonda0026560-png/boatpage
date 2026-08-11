import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const IMAGE =
  'https://images.unsplash.com/photo-1619382997249-4b126250d03e?w=2400&q=75&fm=jpg&fit=crop&auto=format';

export default function Manifesto() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) return;

      gsap.to('.manifesto__img', {
        yPercent: 30,
        ease: 'none',
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="manifesto" id="about">
      <div className="manifesto__img-wrap">
        <img
          className="manifesto__img"
          src={IMAGE}
          alt="맑은 바다 위를 항주하는 보트 항공 촬영"
        />
      </div>
      <h2 className="manifesto__title">
        Built in
        <br />
        Wando <span className="manifesto__slash">/</span> by Hand
      </h2>
    </section>
  );
}