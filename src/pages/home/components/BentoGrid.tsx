import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface BentoItem {
  num: string;
  title: string;
  short: string;
  long: string;
  image: string;
  alt: string;
}

/*
  ⚠️ 아래 image 주소는 아직 리조트 스톡 사진입니다.
  실제 선박 사진으로 교체해야 합니다. alt는 교체될 사진 기준으로 적어두었습니다.
*/
const ITEMS: BentoItem[] = [
  {
    num: '01',
    title: 'Hull',
    short: 'A mono hull that behaves like a trimaran.',
    long:
      'The WLS560 runs a V-form mono hull with a knuckle worked into each side. One hull to build and berth, but the buoyancy and roll damping of three — the boat sits flat when you stand on the gunwale to land a fish.',
    image:
      'https://images.unsplash.com/photo-1575224639406-b218af1ee31e?w=2400&q=75&fm=jpg&fit=crop&auto=format',
    alt: '선회하며 항적을 남기는 레저보트 항공 촬영',
  },
  {
    num: '02',
    title: 'Deep-V',
    short: 'Cuts chop instead of slamming through it.',
    long:
      'Deadrise carried well forward so the bow parts a short sea rather than pounding on it. The knuckles catch the spray the V throws and push it down and out, which keeps the deck dry at working speed.',
    image:
      'https://images.unsplash.com/photo-1541369470242-5e2ac9841992?w=2400&q=75&fm=jpg&fit=crop&auto=format',
    alt: '해안선을 따라 항주하는 보트와 물살',
  },
  {
    num: '03',
    title: 'Hold',
    short: 'A large insulated hold, built into the sole.',
    long:
      'The fish hold is laid up as part of the deck rather than dropped in afterwards. It keeps the catch cold and low, and because the weight sits under the sole it works with the hull instead of against it.',
    image:
      'https://images.unsplash.com/photo-1575224715567-f243fedb7f4f?w=2400&q=75&fm=jpg&fit=crop&auto=format',
    alt: '잔잔한 바다를 지나는 레저보트 항공 촬영',
  },
  {
    num: '04',
    title: 'Deck',
    short: 'Room to cast from bow to transom.',
    long:
      'The centre console layout leaves a clear walkaround. Console position, seating and live wells are set to the way you actually fish — we arrange the fit-out per order rather than shipping one fixed interior.',
    image:
      'https://images.unsplash.com/photo-1552160757-52790c6f4faf?w=2400&q=75&fm=jpg&fit=crop&auto=format',
    alt: '푸른 바다 위를 직진하는 흰색 보트',
  },
  {
    num: '05',
    title: 'Engines',
    short: 'We started with engines, not hulls.',
    long:
      'Wonda began by tuning industrial diesel engines for marine service and installing them in working boats. That grounding is why we size and mount power to what a hull is designed to carry, and never past it.',
    image:
      'https://images.unsplash.com/photo-1567369244263-8f45293b2178?w=2400&q=75&fm=jpg&fit=crop&auto=format',
    alt: '항주하며 흰 물살을 만드는 보트',
  },
];

export default function BentoGrid() {
  const rootRef = useRef<HTMLElement>(null);
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const isNarrow = window.innerWidth <= 760;

      const cards = gsap.utils.toArray<HTMLElement>('.bento__card');
      if (!cards.length) return;

      if (prefersReduced || isNarrow) {
        gsap.set(cards, { opacity: 1, y: 0, rotationX: 0, z: 0 });
        return;
      }

      gsap.set(cards, {
        opacity: 0,
        y: 60,
        z: -500,
        rotationX: 25,
        transformOrigin: 'center center',
      });

      gsap.to(cards, {
        opacity: 1,
        y: 0,
        z: 0,
        rotationX: 0,
        stagger: 0.06,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top 80%',
          end: 'top 20%',
          scrub: true,
        },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const handleCardClick = (index: number) => {
    setFlippedIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section
      ref={rootRef}
      className="bento"
      id="experiences"
      aria-label="What we build"
    >
      <div className="bento__inner">
        {ITEMS.map((item, i) => {
          const isFlipped = flippedIndex === i;
          const isDim = flippedIndex !== null && flippedIndex !== i;
          return (
            <button
              key={item.num}
              type="button"
              onClick={() => handleCardClick(i)}
              className={[
                'bento__card',
                `bento__card--${i + 1}`,
                isFlipped ? 'is-flipped' : '',
                isDim ? 'is-dim' : '',
              ].join(' ')}
              data-cursor="expand"
              aria-label={`${item.title} 상세 보기`}
              aria-pressed={isFlipped}
            >
              <div className="bento__face bento__face--front">
                <img
                  className="bento__img"
                  src={item.image}
                  alt={item.alt}
                />
                <div className="bento__overlay" />
                <div className="bento__content">
                  <div className="bento__num">{item.num}</div>
                  <div className="bento__title">{item.title}</div>
                  <div className="bento__desc">{item.short}</div>
                </div>
              </div>
              <div className="bento__face bento__face--back">
                <div className="bento__num" style={{ color: 'var(--accent)' }}>
                  {item.num} — {item.title}
                </div>
                <div>
                  <div className="bento__back-title">{item.title}</div>
                  <p className="bento__back-body" style={{ marginTop: '1.5rem' }}>
                    {item.long}
                  </p>
                </div>
                <span className="bento__back-close">← Close</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}