# 원다마린산업 (WONDA MARINE INDUSTRY)

전라남도 완도의 FRP 낚시·레저보트 건조 업체 웹사이트.

## 개발

```bash
npm install
npm run dev
```

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 (`out/`) |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run type-check` | 타입 검사 |
| `npm run lint` | 린트 |

## 페이지

| 경로 | 내용 |
| --- | --- |
| `/` | 홈 |
| `/models` | 모델 라인업 |
| `/models/:slug` | 모델 상세 — three.js 3D 뷰어, 색상 선택 |
| `/about` | 기업소개 |
| `/faq` | 자주 묻는 질문 |

## 배포

`main` 브랜치에 푸시하면 GitHub Actions가 빌드해 GitHub Pages로 올린다
(`.github/workflows/deploy.yml`).

**최초 1회 설정이 필요하다.** 저장소 Settings → Pages → Source 를
**GitHub Actions** 로 바꿔야 워크플로가 동작한다.

하위 경로(`/boatpage/`)로 서비스되므로 빌드 시 `BASE_PATH` 를 넘긴다.
`vite.config.ts` 의 `base` 와 `App.tsx` 의 `BrowserRouter basename` 이
모두 이 값을 읽으므로 여기만 바꾸면 경로 전체가 따라간다.

```bash
BASE_PATH=/boatpage/ npm run build
```

커스텀 도메인을 붙이거나 루트로 서비스한다면 워크플로의 `BASE_PATH` 를
`/` 로 바꾸면 된다.

## 아직 채워야 할 것

- **모델 제원** — `src/data/models.ts`. WLS560 외 나머지 제원 미확정.
- **사진** — 홈의 이미지는 전부 임시 스톡 사진이다. 특히 건조 과정
  (`StackedPanels.tsx`)의 성형·의장 사진은 실제 작업장 사진이 필요하다.
  히어로 배경(`Hero.tsx`)도 아직 교체 전이다.
- **카카오톡 채널** — `src/components/layout/ChatButton.tsx` 의
  `KAKAO_CHANNEL_URL`. 비어 있으면 메일 문의 버튼으로 표시된다.

## 기술 스택

React 19 · TypeScript · Vite · React Router · GSAP(ScrollTrigger) ·
Lenis · three.js · Tailwind
