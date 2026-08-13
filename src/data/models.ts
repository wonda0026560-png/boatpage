/**
 * 원다마린산업 모델 라인업.
 *
 * 여기 있는 값은 회사에서 제공한 실제 정보다. 없는 항목은 비워둔다 —
 * 임의로 채우면 영업 현장에서 사고가 난다. 인승·엔진·연료탱크·속력·가격은
 * 아직 받지 못했으므로 화면에 표시하지 않는다.
 */

export interface BoatColor {
  name: string;
  hex: string;
}

export interface BoatSpec {
  label: string;
  value: string;
}

/** 레저보트(WLS 시리즈)와 어선(어장관리선 등)을 목록에서 나눠 보여준다. */
export type BoatCategory = 'leisure' | 'fishing';

export interface BoatModel {
  category: BoatCategory;
  slug: string;
  name: string;
  /** WLS560-X의 (eXtension)처럼 이름 뒤에 작게 붙는 부기 */
  suffix?: string;
  index: string;
  /** 선종 */
  type: string;
  tagline: string;
  description: string;
  /** 카드에 크게 노출할 대표 수치. 없으면 표시하지 않는다. */
  lengthLabel?: string;
  specs: BoatSpec[];
  colors: BoatColor[];
  /** 개발 중인 모델. 상세 페이지를 만들지 않고 목록에만 노출한다. */
  upcoming?: boolean;
  /**
   * 3D 선체 생성 파라미터.
   * beamRatio는 실제 전폭 ÷ 전장이다. WLS560 기준 2.30 / 5.65 = 0.407.
   */
  hull: {
    beamRatio: number;
    flare: number;
    hardTop: boolean;
  };
}

const HULL_COLORS: BoatColor[] = [
  { name: '오션 네이비', hex: '#1B3A57' },
  { name: '펄 화이트', hex: '#EDEAE3' },
  { name: '그래파이트', hex: '#3A3F44' },
  { name: '코퍼', hex: '#B0714F' },
  { name: '포레스트', hex: '#2E4A3C' },
];

export const BOAT_MODELS: BoatModel[] = [
  {
    category: 'leisure',
    slug: 'wls560',
    name: 'WLS560',
    index: '01',
    type: '센터콘솔형 낚시용 레저보트',
    tagline: '삼동선의 장점을 결합한 5M급 선형',
    description:
      'WLS560 모델은 한국 소비자의 요구사항에 최적화된 5M급 낚시용 레저보트를 개발목표로 추구한 모델입니다. V형 모노헐 양쪽에 너클파트를 추가하여 단동선이지만, 삼동선의 장점을 결합한 선형입니다. 부상능력과 부력, 롤링에 유리하며, 대형어창의 탑재와 함께 낚시공간활용성이 뛰어납니다.',
    lengthLabel: '5.65 m',
    specs: [
      { label: '장', value: '5.65 m' },
      { label: '폭', value: '2.30 m' },
      { label: '심', value: '1.09 m' },
    ],
    colors: HULL_COLORS,
    // 너클파트가 양현에 붙어 선측이 벌어지는 형상이라 flare를 크게 준다.
    hull: { beamRatio: 0.407, flare: 1.35, hardTop: false },
  },
  {
    category: 'leisure',
    slug: 'wls560-x',
    name: 'WLS560-X',
    suffix: '(eXtension)',
    index: '02',
    type: '캐빈타입 / 선실타입 / 하우스타입 낚시용 레저보트',
    tagline: '선실을 더한 확장형',
    description:
      'WLS560-X(eXtension)는 기존 WLS560 모델의 확장형 버전으로, 한국 소비자의 요구를 반영하여 더욱 향상된 기능을 제공합니다. WLS560 모델이 갖춘 우수한 횡동요 억제 성능과 높은 안정성을 그대로 유지하면서, 선실(Cabin)을 추가하여 쾌적성과 활용도를 극대화한 것이 특징입니다.',
    // 선체는 WLS560 기반이지만 확장형 제원을 따로 받지 못해 표기하지 않는다.
    specs: [],
    colors: HULL_COLORS,
    hull: { beamRatio: 0.407, flare: 1.35, hardTop: true },
  },
  {
    category: 'leisure',
    slug: 'wls730',
    name: 'WLS730',
    index: '03',
    type: '개발 중',
    tagline: '개발 중',
    description: '',
    specs: [],
    colors: HULL_COLORS,
    upcoming: true,
    hull: { beamRatio: 0.39, flare: 1.3, hardTop: true },
  },
];

/**
 * 목록 페이지의 구획. 순서대로 렌더된다.
 *
 * 해당 카테고리에 모델이 하나도 없으면 그 구획은 그리지 않는다.
 * 빈 제목만 덩그러니 남는 것보다 아예 없는 편이 낫고,
 * 어선 데이터가 채워지는 즉시 자동으로 나타난다.
 */
export const MODEL_SECTIONS: {
  category: BoatCategory;
  label: string;
  description: string;
}[] = [
  {
    category: 'leisure',
    label: '레저보트',
    description:
      '낚시와 레저를 위한 WLS 시리즈입니다. 선실 구성과 의장은 주문에 맞춰 조정합니다.',
  },
  {
    category: 'fishing',
    label: '어선',
    description:
      '1994년부터 이어 온 어선 건조 라인입니다. 어장 여건과 조업 방식에 맞춰 제작합니다.',
  },
];

export function getModelsByCategory(category: BoatCategory) {
  return BOAT_MODELS.filter((m) => m.category === category);
}

/** 상세 페이지가 있는 모델만. 개발 중인 모델은 제외한다. */
export const VIEWABLE_MODELS = BOAT_MODELS.filter((m) => !m.upcoming);

export function getModelBySlug(slug: string | undefined): BoatModel | undefined {
  if (!slug) return undefined;
  return VIEWABLE_MODELS.find((m) => m.slug === slug);
}

/**
 * 상세 페이지 하단 이전/다음 이동용. 라인업 양 끝에서는 순환한다.
 *
 * 모델이 둘뿐이면 순환 계산상 이전과 다음이 같은 모델이 된다.
 * 같은 배를 '이전'과 '다음'으로 두 번 보여주면 고장난 것처럼 보이므로
 * 그 경우에는 다음 하나만 돌려준다.
 */
export function getAdjacentModels(slug: string) {
  const list = VIEWABLE_MODELS;
  const i = list.findIndex((m) => m.slug === slug);
  if (i === -1 || list.length < 2) return { prev: undefined, next: undefined };

  const next = list[(i + 1) % list.length];
  if (list.length === 2) return { prev: undefined, next };

  return { prev: list[(i - 1 + list.length) % list.length], next };
}
