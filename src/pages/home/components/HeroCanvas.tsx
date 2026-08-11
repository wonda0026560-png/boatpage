import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;
  uniform sampler2D uTexture;
  uniform vec2 uMouse;
  uniform float uTime;
  uniform float uRipple;
  uniform vec2 uResolution;
  uniform vec2 uImageResolution;
  varying vec2 vUv;

  void main() {
    // Cover-fit UV
    vec2 s = uResolution;
    vec2 i = uImageResolution;
    float rs = s.x / s.y;
    float ri = i.x / i.y;
    vec2 new = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);
    vec2 offset = (rs < ri ? vec2((new.x - s.x) / 2.0, 0.0) : vec2(0.0, (new.y - s.y) / 2.0)) / new;
    vec2 uv = vUv * s / new + offset;

    // Ripple distortion
    float dist = distance(vUv, uMouse);
    float ripple = sin(dist * 30.0 - uTime * 3.0) * 0.02 * uRipple;
    ripple *= smoothstep(0.4, 0.0, dist);
    uv += ripple;

    // Subtle waves
    uv.x += sin(uv.y * 8.0 + uTime * 0.3) * 0.002;

    vec4 color = texture2D(uTexture, uv);
    gl_FragColor = color;
  }
`;

interface HeroCanvasProps {
  imageUrl: string;
}

export default function HeroCanvas({ imageUrl }: HeroCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isNarrow = window.innerWidth <= 760;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isNarrow || prefersReduced) return;

    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';

    const geometry = new THREE.PlaneGeometry(2, 2);
    const uniforms = {
      uTexture: { value: null as THREE.Texture | null },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uTime: { value: 0 },
      uRipple: { value: 0 },
      uResolution: {
        value: new THREE.Vector2(container.clientWidth, container.clientHeight),
      },
      uImageResolution: { value: new THREE.Vector2(1, 1) },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    loader.load(imageUrl, (tex) => {
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      uniforms.uTexture.value = tex;
      const img = tex.image as HTMLImageElement;
      uniforms.uImageResolution.value.set(img.width, img.height);
    });

    let targetMouse = new THREE.Vector2(0.5, 0.5);
    let smoothMouse = new THREE.Vector2(0.5, 0.5);
    let rippleTarget = 0;

    const onMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        rippleTarget = 0;
        return;
      }
      targetMouse.x = (e.clientX - rect.left) / rect.width;
      targetMouse.y = 1 - (e.clientY - rect.top) / rect.height;
      rippleTarget = 1;
    };

    const onLeave = () => {
      rippleTarget = 0;
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    container.addEventListener('mouseleave', onLeave);

    const clock = new THREE.Clock();
    let raf = 0;

    const animate = () => {
      const t = clock.getElapsedTime();
      uniforms.uTime.value = t;

      smoothMouse.x += (targetMouse.x - smoothMouse.x) * 0.08;
      smoothMouse.y += (targetMouse.y - smoothMouse.y) * 0.08;
      uniforms.uMouse.value.copy(smoothMouse);

      uniforms.uRipple.value += (rippleTarget - uniforms.uRipple.value) * 0.05;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };

    animate();

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      uniforms.uResolution.value.set(w, h);
    };

    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mouseleave', onLeave);
      geometry.dispose();
      material.dispose();
      if (uniforms.uTexture.value) uniforms.uTexture.value.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [imageUrl]);

  return <div ref={containerRef} className="hero__canvas" aria-hidden="true" />;
}