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

## 배포 (Railway)

GitHub 저장소를 Railway 프로젝트에 연결해두면 `main` 에 푸시할 때마다
자동으로 빌드·재배포된다. 설정은 `railway.json` 에 있다.

| 단계 | 명령 |
| --- | --- |
| 빌드 | `npm run build` → `out/` |
| 실행 | `npm start` |

`npm start` 는 `serve -s out` 으로 정적 파일을 띄운다.

- `-s` 옵션이 SPA 폴백을 처리한다. 이게 없으면 `/models` 같은 주소로
  직접 들어왔을 때 404 가 난다. 라우팅이 클라이언트에서만 존재하기 때문이다.
- 포트는 Railway 가 주입하는 `PORT` 를 그대로 쓰고 `0.0.0.0` 에 바인딩한다.
  `localhost` 에 바인딩하면 컨테이너 밖에서 접속되지 않는다.

### 경로 설정

Railway 는 루트(`/`)로 서비스하므로 기본값을 그대로 쓰면 된다.
GitHub Pages 처럼 하위 경로로 올릴 때만 `BASE_PATH` 를 넘긴다.

```bash
BASE_PATH=/하위경로/ npm run build
```

`vite.config.ts` 의 `base` 와 `App.tsx` 의 `BrowserRouter basename` 이
모두 이 값을 읽으므로 여기만 바꾸면 경로 전체가 따라간다.

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
