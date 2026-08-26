/**
 * 원다마린산업 모델 라인업.
 *
 * 여기 있는 값은 회사에서 제공한 실제 정보다. 없는 항목은 비워둔다 —
 * 임의로 채우면 영업 현장에서 사고가 난다.
 *
 * 어선(어장관리선)은 회사가 제공한 실측 사진과 파일명의 톤수 표기를
 * 그대로 옮긴 것이다. 전장·정원 등 나머지 제원은 아직 받지 못했다.
 */

import fm075 from '../assets/boats/fm-075.jpg';
import fm089 from '../assets/boats/fm-089.jpg';
import fm120 from '../assets/boats/fm-120.jpg';
import fm140 from '../assets/boats/fm-140.jpg';
import fm178 from '../assets/boats/fm-178.jpg';
import fm190 from '../assets/boats/fm-190.jpg';
import fm793 from '../assets/boats/fm-793.jpg';
import fm977 from '../assets/boats/fm-977.jpg';
import fm977in from '../assets/boats/fm-977-in.jpg';
import fm075t from '../assets/boats/thumbs/fm-075.jpg';
import fm089t from '../assets/boats/thumbs/fm-089.jpg';
import fm120t from '../assets/boats/thumbs/fm-120.jpg';
import fm140t from '../assets/boats/thumbs/fm-140.jpg';
import fm178t from '../assets/boats/thumbs/fm-178.jpg';
import fm190t from '../assets/boats/thumbs/fm-190.jpg';
import fm793t from '../assets/boats/thumbs/fm-793.jpg';
import fm977t from '../assets/boats/thumbs/fm-977.jpg';
import fm977int from '../assets/boats/thumbs/fm-977-in.jpg';

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
  /** 목록·상세 헤더에 크게 노출할 대표 수치. 레저보트는 전장, 어선은 톤수. */
  keyFigure?: BoatSpec;
  specs: BoatSpec[];
  /** 색상 선택 UI. 비어 있으면 그 구획 자체를 그리지 않는다. */
  colors: BoatColor[];
  /** 아직 상세 페이지를 열지 않는 모델. 목록에만 노출한다. */
  upcoming?: boolean;
  /** upcoming 모델의 상태 표시. 기본값은 '개발 중'. */
  badge?: string;
  /**
   * 실물 사진. 있으면 상세 페이지에서 3D 뷰어 대신 사진을 보여주고,
   * 목록 행에 썸네일이 붙는다.
   */
  photo?: string;
  thumb?: string;
  photoAlt?: string;
  /**
   * 3D 선체 생성 파라미터. 사진이 없는 모델(레저보트)에만 쓴다.
   * beamRatio는 실제 전폭 ÷ 전장이다. WLS560 기준 2.30 / 5.65 = 0.407.
   */
  hull?: {
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

/** 어장관리선 공통 설명. 톤수별 개별 문구를 받으면 각 모델로 옮긴다. */
const FISHING_DESCRIPTION =
  '1994년부터 이어 온 어장관리선 건조 라인입니다. 어장 여건과 조업 방식에 맞춰 선형과 의장을 조정해 제작하며, 사진은 실제 건조·인도된 선박입니다.';

function fishingModel(args: {
  slug: string;
  index: string;
  ton: string;
  /**
   * 기관 형식. 같은 톤수라도 선내기·선외기는 별개 모델이라
   * 이름 뒤에 작게 붙여 목록에서 구분되게 한다.
   */
  engine?: '선내기' | '선외기';
  photo?: string;
  thumb?: string;
  photoAlt?: string;
  upcoming?: boolean;
  badge?: string;
}): BoatModel {
  return {
    category: 'fishing',
    slug: args.slug,
    name: `${args.ton}톤급`,
    suffix: args.engine,
    index: args.index,
    type: args.engine ? `어장관리선 · ${args.engine}` : '어장관리선',
    upcoming: args.upcoming,
    badge: args.badge,
    tagline: '어장 여건에 맞춘 주문 건조',
    description: FISHING_DESCRIPTION,
    keyFigure: { label: '톤수', value: `${args.ton}톤급` },
    specs: [{ label: '톤수', value: `${args.ton}톤급` }],
    colors: [],
    photo: args.photo,
    thumb: args.thumb,
    photoAlt: args.photoAlt,
  };
}

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
    keyFigure: { label: '전장', value: '5.65 m' },
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

  // ---- 어장관리선 (톤수 오름차순) ----
  fishingModel({
    slug: 'fm-075',
    index: '01',
    ton: '0.75',
    photo: fm075,
    thumb: fm075t,
    photoAlt: '계류 중인 0.75톤급 어장관리선',
  }),
  fishingModel({
    slug: 'fm-089',
    index: '02',
    ton: '0.89',
    photo: fm089,
    thumb: fm089t,
    photoAlt: '육상 거치된 0.89톤급 어장관리선',
  }),
  fishingModel({
    slug: 'fm-120',
    index: '03',
    ton: '1.20',
    photo: fm120,
    thumb: fm120t,
    photoAlt: '가두리 양식장 옆에 계류한 1.20톤급 어장관리선',
  }),
  fishingModel({
    slug: 'fm-140',
    index: '04',
    ton: '1.40',
    photo: fm140,
    thumb: fm140t,
    photoAlt: '항구에 계류한 1.40톤급 어장관리선',
  }),
  fishingModel({
    slug: 'fm-178',
    index: '05',
    ton: '1.78',
    photo: fm178,
    thumb: fm178t,
    photoAlt: '운항 중인 1.78톤급 어장관리선',
  }),
  fishingModel({
    slug: 'fm-190',
    index: '06',
    ton: '1.90',
    photo: fm190,
    thumb: fm190t,
    photoAlt: '계류 중인 1.90톤급 어장관리선',
  }),
  fishingModel({
    slug: 'fm-793',
    index: '07',
    ton: '7.93',
    engine: '선외기',
    photo: fm793,
    thumb: fm793t,
    photoAlt: '크레인을 장착한 7.93톤급 어장관리선',
  }),
  fishingModel({
    slug: 'fm-977',
    index: '08',
    ton: '9.77',
    engine: '선외기',
    photo: fm977,
    thumb: fm977t,
    photoAlt: '조선소 야드에 거치된 9.77톤급 선외기 어장관리선',
  }),
  fishingModel({
    slug: 'fm-977-in',
    index: '09',
    ton: '9.77',
    engine: '선내기',
    photo: fm977in,
    thumb: fm977int,
    photoAlt: '나란히 계류된 9.77톤급 선내기 어장관리선 두 척',
  }),
  // 건조 완료, 진수 후 사진을 받으면 상세 페이지를 연다
  fishingModel({
    slug: 'fm-1400-in',
    index: '10',
    ton: '14',
    engine: '선내기',
    upcoming: true,
    badge: '진수 예정',
  }),
];

/**
 * 목록 페이지의 구획. 순서대로 렌더된다.
 *
 * 해당 카테고리에 모델이 하나도 없으면 그 구획은 그리지 않는다.
 * 빈 제목만 덩그러니 남는 것보다 아예 없는 편이 낫다.
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
 * 상세 페이지 하단 이전/다음 이동용.
 *
 * 같은 카테고리 안에서만 순환한다 — 9.77톤 어선의 '다음'이 레저보트로
 * 튀면 라인업을 훑는 흐름이 끊긴다. 모델이 둘뿐이면 순환 계산상
 * 이전과 다음이 같은 모델이 되므로 그 경우에는 다음 하나만 돌려준다.
 */
export function getAdjacentModels(slug: string) {
  const current = VIEWABLE_MODELS.find((m) => m.slug === slug);
  if (!current) return { prev: undefined, next: undefined };

  const list = VIEWABLE_MODELS.filter((m) => m.category === current.category);
  const i = list.findIndex((m) => m.slug === slug);
  if (list.length < 2) return { prev: undefined, next: undefined };

  const next = list[(i + 1) % list.length];
  if (list.length === 2) return { prev: undefined, next };

  return { prev: list[(i - 1 + list.length) % list.length], next };
}
