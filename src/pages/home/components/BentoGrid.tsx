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
    short: '단동선이지만 삼동선처럼 거동하는 선형.',
    long:
      'WLS560은 V형 모노헐 양현에 너클파트를 더한 선형입니다. 건조와 계류는 단동선처럼 간편하면서 부력과 횡동요 억제는 삼동선의 장점을 가져와, 뱃전에 서서 고기를 걷어 올려도 배가 크게 기울지 않습니다.',
    image:
      'https://images.unsplash.com/photo-1575224639406-b218af1ee31e?w=2400&q=75&fm=jpg&fit=crop&auto=format',
    alt: '선회하며 항적을 남기는 레저보트 항공 촬영',
  },
  {
    num: '02',
    title: 'Deep-V',
    short: '파도를 때리지 않고 가르며 나아갑니다.',
    long:
      '선수까지 깊게 이어지는 V형 선저가 짧은 너울을 두드리지 않고 가릅니다. V가 밀어낸 물보라는 너클파트가 받아 아래로 눌러 주어, 항주 속도에서도 갑판이 잘 젖지 않습니다.',
    image:
      'https://images.unsplash.com/photo-1541369470242-5e2ac9841992?w=2400&q=75&fm=jpg&fit=crop&auto=format',
    alt: '해안선을 따라 항주하는 보트와 물살',
  },
  {
    num: '03',
    title: 'Hold',
    short: '갑판에 매립해 성형한 대형 어창.',
    long:
      '어창을 나중에 얹지 않고 갑판과 한 몸으로 성형합니다. 어획물을 낮고 차게 보관할 수 있고, 무게가 바닥 아래에 실려 선체 균형에도 유리합니다.',
    image:
      'https://images.unsplash.com/photo-1575224715567-f243fedb7f4f?w=2400&q=75&fm=jpg&fit=crop&auto=format',
    alt: '잔잔한 바다를 지나는 레저보트 항공 촬영',
  },
  {
    num: '04',
    title: 'Deck',
    short: '선수부터 선미까지 트인 낚시 공간.',
    long:
      '센터콘솔 배치로 배 둘레를 한 바퀴 돌 수 있는 통로를 확보했습니다. 콘솔 위치·좌석·활어창은 정해진 구성 하나로 찍어내지 않고, 실제 낚시하시는 방식에 맞춰 주문마다 조정합니다.',
    image:
      'https://images.unsplash.com/photo-1552160757-52790c6f4faf?w=2400&q=75&fm=jpg&fit=crop&auto=format',
    alt: '푸른 바다 위를 직진하는 흰색 보트',
  },
  {
    num: '05',
    title: 'Engines',
    short: '우리는 선체가 아니라 엔진에서 시작했습니다.',
    long:
      '원다는 산업용 디젤엔진을 선박용으로 튜닝해 장착하는 일에서 출발했습니다. 그 경험이 있기에 선체가 설계상 감당하는 만큼만 엔진을 올리고, 그 이상은 달아 드리지 않습니다.',
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
                <span className="bento__back-close">← 닫기</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}