import * as THREE from 'three';

/**
 * 선체 지오메트리를 코드로 만든다.
 *
 * 실제 선박 설계와 같은 방식이다. 선수에서 선미까지 일정 간격으로 단면(station)을
 * 정의하고, 각 단면의 윤곽선을 같은 개수의 점으로 표현한 뒤, 이웃한 단면끼리
 * 점을 이어 면을 만든다(로프팅).
 *
 * .glb 모델이 준비되면 이 파일 대신 GLTFLoader를 쓰면 된다. BoatViewer3D는
 * buildBoat()가 돌려주는 Group만 알고 있으므로 교체 범위가 여기서 끝난다.
 */

export interface HullOptions {
  /** 전장 대비 폭 비율 */
  beamRatio: number;
  /** 선수가 위로 벌어지는 정도 */
  flare: number;
  /** T-top 유무 */
  hardTop: boolean;
}

const LENGTH = 10;
const STATIONS = 40;
const POINTS_PER_STATION = 24;

/** 0(선미) ~ 1(선수) 위치에서의 선체 폭 배율. 선미가 넓고 선수로 갈수록 좁아진다. */
function beamAt(t: number) {
  /*
    t=0이 선미(트랜섬), t=1이 선수다.

    이전 식은 π*0.98을 곱해 sin이 π를 넘기면서 t=0에서 값이 0.08까지 떨어졌다.
    즉 선미가 뾰족하고 선수가 넓은, 앞뒤가 뒤집힌 선형이었다. 활주형 선체는
    트랜섬에서 가장 넓고 선수로 가면서 좁아진다.
  */
  return Math.sin(Math.pow(1 - t, 0.5) * Math.PI * 0.5);
}

/** 선저 깊이 배율. 선수로 갈수록 V가 깊어진다(딥 V 선형). */
function deadriseAt(t: number) {
  return 0.55 + t * 0.85;
}

/** 시어 라인 — 갑판 가장자리 높이. 선수가 들려 있어야 배처럼 보인다. */
function sheerAt(t: number) {
  return 0.42 + Math.pow(t, 2.1) * 0.72;
}

/** 킬 라인 — 배 바닥선. 선미는 평평하고 선수는 물 위로 솟는다. */
function keelAt(t: number) {
  return t < 0.78 ? 0 : Math.pow((t - 0.78) / 0.22, 1.8) * 0.95;
}

/**
 * 한 단면의 윤곽점을 만든다.
 * 우현 갑판 → 우현 선측 → 선저 V → 좌현 선측 → 좌현 갑판 순서로 돈다.
 */
function stationProfile(t: number, opts: HullOptions): THREE.Vector3[] {
  const x = (t - 0.5) * LENGTH;
  const halfBeam = beamAt(t) * LENGTH * opts.beamRatio * 0.5;
  const sheer = sheerAt(t);
  const keel = keelAt(t);
  const deadrise = deadriseAt(t);

  const pts: THREE.Vector3[] = [];
  const half = POINTS_PER_STATION / 2;

  for (let i = 0; i < POINTS_PER_STATION; i++) {
    // s: -1(좌현) ~ +1(우현)
    const s = i < half ? 1 - i / (half - 1) * 2 : -1 + (i - half) / (half - 1) * 2;
    const side = Math.sign(s) || 1;
    const a = Math.abs(s);

    // a=1 갑판 가장자리, a=0 킬. 선측은 거의 수직, 선저는 V.
    const widthCurve = Math.pow(a, 0.55);
    const flare = 1 + (1 - a) * 0 + opts.flare * 0.12 * Math.pow(t, 2) * a;
    const y = side * halfBeam * widthCurve * flare;

    const z =
      a > 0.55
        ? // 선측: 갑판까지 곧게 올라간다
          keel + deadrise * 0.5 + ((a - 0.55) / 0.45) * (sheer - keel - deadrise * 0.5)
        : // 선저: 킬에서 빌지까지 V자
          keel + Math.pow(a / 0.55, 1.5) * deadrise * 0.5;

    pts.push(new THREE.Vector3(x, y, z));
  }
  return pts;
}

function buildHullMesh(opts: HullOptions, material: THREE.Material) {
  const rings: THREE.Vector3[][] = [];
  for (let s = 0; s <= STATIONS; s++) {
    rings.push(stationProfile(s / STATIONS, opts));
  }

  const positions: number[] = [];
  const indices: number[] = [];

  rings.forEach((ring) => ring.forEach((p) => positions.push(p.x, p.z, p.y)));

  const n = POINTS_PER_STATION;
  for (let s = 0; s < STATIONS; s++) {
    for (let i = 0; i < n - 1; i++) {
      const a = s * n + i;
      const b = a + 1;
      const c = a + n;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  // 선미 트랜섬을 막는다.
  const sternCenter = positions.length / 3;
  positions.push(-LENGTH / 2, keelAt(0) + 0.35, 0);
  for (let i = 0; i < n - 1; i++) {
    indices.push(sternCenter, i + 1, i);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** 갑판 — 시어 라인 안쪽을 덮는 평면. */
function buildDeck(opts: HullOptions, material: THREE.Material) {
  const shape = new THREE.Shape();
  const pts: THREE.Vector2[] = [];
  for (let s = 0; s <= STATIONS; s++) {
    const t = s / STATIONS;
    const x = (t - 0.5) * LENGTH;
    const y = beamAt(t) * LENGTH * opts.beamRatio * 0.5 * 0.93;
    pts.push(new THREE.Vector2(x, y));
  }
  for (let s = STATIONS; s >= 0; s--) {
    const t = s / STATIONS;
    const x = (t - 0.5) * LENGTH;
    const y = -beamAt(t) * LENGTH * opts.beamRatio * 0.5 * 0.93;
    pts.push(new THREE.Vector2(x, y));
  }
  shape.setFromPoints(pts);

  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.07, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);

  const mesh = new THREE.Mesh(geo, material);
  // 갑판을 시어 라인 근처 높이에 올린다.
  mesh.position.y = 0.82;
  mesh.receiveShadow = true;
  return mesh;
}

function box(
  w: number,
  h: number,
  d: number,
  material: THREE.Material,
  x = 0,
  y = 0,
  z = 0
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  return mesh;
}

/** 선외기. */
function buildOutboard(material: THREE.Material, offsetZ: number) {
  const g = new THREE.Group();
  g.add(box(0.55, 0.75, 0.5, material, 0, 0.35, offsetZ));
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.11, 0.95, 12),
    material
  );
  shaft.position.set(0, -0.35, offsetZ);
  g.add(shaft);
  const skeg = box(0.5, 0.16, 0.12, material, 0.05, -0.82, offsetZ);
  g.add(skeg);
  g.position.x = -LENGTH / 2 - 0.3;
  return g;
}

export interface BoatBuild {
  group: THREE.Group;
  /** 색상 변경 대상. 선체와 갑판이 함께 바뀐다. */
  hullMaterial: THREE.MeshStandardMaterial;
  dispose: () => void;
}

export function buildBoat(opts: HullOptions): BoatBuild {
  const group = new THREE.Group();

  const hullMaterial = new THREE.MeshStandardMaterial({
    color: '#1B3A57',
    roughness: 0.32,
    metalness: 0.12,
    side: THREE.DoubleSide,
  });
  const deckMaterial = new THREE.MeshStandardMaterial({
    color: '#E6E1D6',
    roughness: 0.85,
  });
  const darkMaterial = new THREE.MeshStandardMaterial({
    color: '#20262B',
    roughness: 0.5,
    metalness: 0.3,
  });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: '#9FC4D6',
    roughness: 0.08,
    metalness: 0.6,
    transparent: true,
    opacity: 0.45,
  });

  group.add(buildHullMesh(opts, hullMaterial));
  group.add(buildDeck(opts, deckMaterial));

  /*
    갑판 위 구조물은 선폭에 비례해야 한다. 고정 치수로 두면 폭이 넓은 선형
    (WLS560은 2.30 / 5.65 = 0.407)에서 콘솔이 갑판에 비해 왜소해 보인다.
  */
  const beam = LENGTH * opts.beamRatio;

  // 조종 콘솔. 전면창은 콘솔 바로 위에 같은 축으로 올려야 한 덩어리로 읽힌다.
  group.add(box(beam * 0.37, 1.0, beam * 0.37, deckMaterial, 0.4, 1.35, 0));
  group.add(box(beam * 0.3, 0.5, beam * 0.34, glassMaterial, 0.4, 2.0, 0));

  // 선미 벤치
  group.add(box(beam * 0.27, 0.5, beam * 0.5, deckMaterial, -3.4, 1.1, 0));

  if (opts.hardTop) {
    // 선실(캐빈) 지붕: 기둥 4개 + 상판. 폭은 콘솔과 같은 비율을 따른다.
    const halfZ = beam * 0.19;
    const legs = [
      [1.1, halfZ],
      [1.1, -halfZ],
      [-0.4, halfZ],
      [-0.4, -halfZ],
    ];
    legs.forEach(([x, z]) => {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 1.7, 10),
        darkMaterial
      );
      leg.position.set(x, 2.7, z);
      group.add(leg);
    });
    group.add(box(2.6, 0.1, beam * 0.52, darkMaterial, 0.35, 3.6, 0));
  }

  // WLS560급 5M대 선체는 선외기 1기가 표준이다.
  group.add(buildOutboard(darkMaterial, 0));

  const dispose = () => {
    group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
      }
    });
    [hullMaterial, deckMaterial, darkMaterial, glassMaterial].forEach((m) => m.dispose());
  };

  return { group, hullMaterial, dispose };
}
