import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const MARQUEE_ITEMS = [
  'FRP Hulls',
  'Deep-V Knuckle',
  'Center Console',
  'Cabin Models',
  'Custom Fit-Out',
  'Sea Trials',
  'Boat Storage',
];

export default function Marquee() {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const rootEl = rootRef.current;
    let onEnter: (() => void) | null = null;
    let onLeave: (() => void) | null = null;

    const ctx = gsap.context(() => {
      const track = trackRef.current;
      if (!track) return;

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Continuous auto scroll
      const tween = gsap.to(track, {
        xPercent: -50,
        duration: 40,
        ease: 'none',
        repeat: -1,
      });

      if (prefersReduced) {
        tween.pause();
        return;
      }

      // Skew based on scroll velocity
      let currentSkew = 0;
      const st = ScrollTrigger.create({
        trigger: rootEl,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          const velocity = self.getVelocity();
          const targetSkew = gsap.utils.clamp(-14, 14, velocity * 0.008);
          currentSkew += (targetSkew - currentSkew) * 0.2;
          gsap.set(track, { skewX: currentSkew });
        },
      });

      // Slow on hover
      onEnter = () => tween.timeScale(0.2);
      onLeave = () => tween.timeScale(1);
      rootEl?.addEventListener('mouseenter', onEnter);
      rootEl?.addEventListener('mouseleave', onLeave);

      return () => {
        st.kill();
      };
    }, rootRef);

    return () => {
      if (rootEl && onEnter) rootEl.removeEventListener('mouseenter', onEnter);
      if (rootEl && onLeave) rootEl.removeEventListener('mouseleave', onLeave);
      ctx.revert();
    };
  }, []);

  const renderRow = (key: string) => (
    <div className="marquee__track" ref={key === 'a' ? trackRef : undefined} key={key}>
      {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
        <span className="marquee__item" key={`${key}-${i}`}>
          {item}
          <span className="marquee__dot">·</span>
        </span>
      ))}
    </div>
  );

  return (
    <div ref={rootRef} className="marquee" aria-hidden="true">
      {renderRow('a')}
    </div>
  );
}