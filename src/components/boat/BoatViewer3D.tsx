import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { buildBoat, type HullOptions } from './boatGeometry';

interface Props {
  hull: HullOptions;
  /** 선체 색. 바뀌면 재생성 없이 재질만 갱신한다. */
  color: string;
  modelName: string;
}

function webglAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') || canvas.getContext('webgl'))
    );
  } catch {
    return false;
  }
}

export default function BoatViewer3D({ hull, color, modelName }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const hullMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const [supported, setSupported] = useState(true);

  // 씬은 선체 형상(hull)이 바뀔 때만 다시 만든다. 색 변경은 아래 별도 effect.
  useEffect(() => {
    if (!webglAvailable()) {
      setSupported(false);
      return;
    }
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const boat = buildBoat(hull);
    hullMaterialRef.current = boat.hullMaterial;
    boat.hullMaterial.color.set(color);
    scene.add(boat.group);

    // 조명 — 메인 사이트의 차분한 톤에 맞춰 부드럽게.
    scene.add(new THREE.HemisphereLight(0xdfe8f0, 0x0b1d2e, 1.15));
    const key = new THREE.DirectionalLight(0xffffff, 2.1);
    key.position.set(8, 12, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 40;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xc87e5a, 1.1);
    rim.position.set(-9, 4, -7);
    scene.add(rim);

    // 배가 떠 있는 느낌을 주는 그림자 받이.
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(14, 48),
      new THREE.ShadowMaterial({ opacity: 0.28 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.6;
    floor.receiveShadow = true;
    scene.add(floor);

    // ---- 카메라 제어 (드래그 회전 / 휠 줌) ----
    let theta = Math.PI * 0.24;
    let phi = Math.PI * 0.36;
    let radius = 20;
    let targetTheta = theta;
    let targetPhi = phi;
    let targetRadius = radius;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let userTouched = false;

    const el = renderer.domElement;
    el.style.touchAction = 'pan-y';

    const onDown = (e: PointerEvent) => {
      dragging = true;
      userTouched = true;
      lastX = e.clientX;
      lastY = e.clientY;
      el.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      targetTheta -= (e.clientX - lastX) * 0.008;
      targetPhi -= (e.clientY - lastY) * 0.006;
      // 수평선 아래로 내려가거나 머리 위로 넘어가지 않도록 제한
      targetPhi = Math.max(0.12, Math.min(Math.PI * 0.49, targetPhi));
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      dragging = false;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    };
    const onWheel = (e: WheelEvent) => {
      // 페이지 스크롤을 뺏지 않도록, 확대/축소 여지가 있을 때만 가로챈다.
      const next = targetRadius + e.deltaY * 0.02;
      const clamped = Math.max(11, Math.min(34, next));
      if (clamped !== targetRadius) {
        e.preventDefault();
        userTouched = true;
        targetRadius = clamped;
      }
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('wheel', onWheel, { passive: false });

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = mount;
      if (!w || !h) return;
      // updateStyle을 끄면 캔버스의 CSS 크기가 설정되지 않아, 백버퍼 크기(w × dpr)
      // 그대로 레이아웃돼 컨테이너를 넘친다. 기본값(true)을 그대로 쓴다.
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    let raf = 0;
    const render = () => {
      // 사용자가 아직 만지지 않았으면 천천히 돌며 3D임을 알린다.
      if (!userTouched) targetTheta += 0.0022;

      theta += (targetTheta - theta) * 0.09;
      phi += (targetPhi - phi) * 0.09;
      radius += (targetRadius - radius) * 0.09;

      camera.position.set(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
      camera.lookAt(0, 0.6, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('wheel', onWheel);
      boat.dispose();
      renderer.dispose();
      if (el.parentNode === mount) mount.removeChild(el);
      hullMaterialRef.current = null;
    };
    // color는 여기서 제외한다 — 색만 바꾸려고 씬을 다시 만들 이유가 없다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hull]);

  useEffect(() => {
    hullMaterialRef.current?.color.set(color);
  }, [color]);

  if (!supported) {
    return (
      <div className="boat3d boat3d--fallback">
        <p className="boat3d__fallback-title">{modelName}</p>
        <p className="boat3d__fallback-body">
          이 브라우저에서는 3D 보기를 지원하지 않습니다. 아래 제원표를 참고해 주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="boat3d">
      <div ref={mountRef} className="boat3d__canvas" />
      <span className="boat3d__hint">드래그 — 회전 · 휠 — 확대</span>
    </div>
  );
}
