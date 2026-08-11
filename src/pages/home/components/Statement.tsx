import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  { num: '01', label: 'Design' },
  { num: '02', label: 'Mould' },
  { num: '03', label: 'Fit-Out' },
  { num: '04', label: 'Launch' },
];

export default function Statement() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        gsap.set('.statement__title em', { opacity: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        '.statement__title em',
        { opacity: 0.15, y: 40 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.04,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top 80%',
            end: 'top 20%',
            scrub: true,
          },
        }
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const renderWord = (word: string) => (
    <span>
      {word.split('').map((ch, i) => (
        <em key={`${word}-${i}`}>{ch}</em>
      ))}
    </span>
  );

  return (
    <section ref={rootRef} className="statement" id="lineup-intro">
      <h2 className="statement__title">
        {renderWord('Built')}
        {renderWord('Right')}
      </h2>
      <ul className="statement__list">
        {STEPS.map((s) => (
          <li className="statement__item" key={s.num}>
            <span className="statement__item-num">{s.num}</span>
            <span className="statement__item-label">— {s.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}