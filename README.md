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
| `/board` | 게시판 목록 |
| `/board/:slug` | 게시판 글 |
| `/admin`, `/admin/posts/:id` | 관리자 — 글 목록·편집기 (헤더 메뉴에 없음, noindex) |

## 배포 (Railway)

GitHub 저장소를 Railway 프로젝트에 연결해두면 `main` 에 푸시할 때마다
자동으로 빌드·재배포된다. 설정은 `railway.json` 에 있다.

| 단계 | 명령 |
| --- | --- |
| 빌드 | `npm run build` → `out/` |
| 실행 | `npm start` → `server/index.js` |

`server/index.js` 는 Express 한 프로세스로 세 가지를 맡는다.
빌드된 정적 사이트(SPA 폴백 포함), 게시판 공개 API, 관리자 API.
포트는 Railway 가 주입하는 `PORT` 를 그대로 쓴다.

### 환경변수 (Railway → Variables)

| 이름 | 설명 |
| --- | --- |
| `DATABASE_URL` | Postgres 주소. Railway 에서 Postgres 를 추가하고 이 서비스에 **참조 변수**로 연결한다 (`${{Postgres.DATABASE_URL}}`) |
| `ADMIN_PASSWORD` | `/admin` 로그인 비밀번호 |
| `SESSION_SECRET` | 로그인 쿠키 서명 키. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` 로 생성 |
| `SITE_URL` | 배포 도메인. 공유 카드·canonical 에 쓰인다 |

세 개 중 하나라도 없으면 사이트는 뜨지만 게시판 API·관리자 로그인이 막힌다.
서버 로그에 어떤 값이 빠졌는지 찍힌다.

## 게시판 관리

글은 Postgres 에 저장되고 `/admin` 에서 작성한다 (헤더 메뉴에는 없다).

- **새 글 쓰기** 를 누르면 빈 초안이 만들어지고 편집기가 열린다.
  사진이 글에 붙어야 하므로 먼저 만든다.
- 본문은 평문이다. **빈 줄로 문단을 나눈다.**
- 사진은 올릴 때 긴 변 1600px JPEG 로 자동 축소해 DB 에 넣는다.
  캡션은 사진 아래 입력칸에 쓴다.
- **게시판에 공개** 를 켜고 저장해야 목록에 나온다. 공개하려면 제목이 있어야 한다.
- 주소(slug)는 자동으로 `날짜-난수` 가 붙는다. 바꾸려면 영문 소문자·숫자·하이픈만.

로컬에서 관리자까지 돌려 보려면 `.env.example` 을 `.env` 로 복사해 채우고
터미널 두 개로 `npm run dev:api` 와 `npm run dev` 를 띄운다.
vite 가 `/api` 요청을 API 서버(3002)로 넘긴다.

### 경로 설정

Railway 는 루트(`/`)로 서비스하므로 기본값을 그대로 쓰면 된다.
GitHub Pages 처럼 하위 경로로 올릴 때만 `BASE_PATH` 를 넘긴다.

```bash
BASE_PATH=/하위경로/ npm run build
```

`vite.config.ts` 의 `base` 와 `App.tsx` 의 `BrowserRouter basename` 이
모두 이 값을 읽으므로 여기만 바꾸면 경로 전체가 따라간다.

## 아직 채워야 할 것

- **모델 제원** — `src/data/models.ts`. WLS560 외 나머지는 톤수만 확정.
  제원 배열이 비면 상세 페이지가 "준비 중" 으로 표시된다.
  14톤급 선내기는 진수 후 사진·제원을 받기로 했다.
- **사진** — 히어로·건조 과정은 실제 사진으로 교체했다.
  남은 스톡 사진은 홈 `BentoGrid.tsx` 의 카드 5장(Unsplash)뿐이다.
- **카카오톡 채널** — `src/components/layout/ChatButton.tsx` 의
  `KAKAO_CHANNEL_URL`. 비어 있으면 메일 문의 버튼으로 표시된다.
- **확인이 필요한 문구** — 어창 성형 공법, 주문마다 의장 조정, 엔진 과마력 거부,
  자체 몰드·전수 시운전. 사실 확인 전까지는 근거가 없는 서술이다.

## 기술 스택

React 19 · TypeScript · Vite · React Router · GSAP(ScrollTrigger) ·
Lenis · three.js · Tailwind
