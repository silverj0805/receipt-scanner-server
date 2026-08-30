# receipt-scanner-server

영수증 스캔 가계부 앱의 백엔드 API 서버입니다. React Native 앱의 네이티브 모듈(TurboModule)이 온디바이스 OCR로 인식한 영수증 텍스트를 전달받고, 사용자가 앱에서 직접 고른 카테고리와 함께 저장하며, 가계부 목록 조회와 대시보드 집계(이번 달 합계, 카테고리 비율, 전월 대비)를 제공합니다.

## 기술 스택

- **Express** — HTTP 서버 프레임워크
- **Prisma** (driver adapter: `@prisma/adapter-better-sqlite3`) — ORM
- **SQLite** — 파일 기반 DB
- **TypeScript**

## 폴더 구조

기술 계층이 아닌 **비즈니스 컴포넌트 단위**로 구성했습니다 ([Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices) "Structure your solution by self-contained components" 컨벤션 기반).

```
receipt-scanner-server/
├─ src/
│  ├─ apps/                  # 비즈니스 컴포넌트 (도메인별 폴더)
│  │  ├─ receipts/           # 영수증 컴포넌트
│  │  │  ├─ entry-points/    # HTTP 요청을 받는 라우팅 계층
│  │  │  │  └─ api/
│  │  │  ├─ domain/          # 순수 비즈니스 로직 (대시보드 집계, 페이지네이션 등)
│  │  │  └─ data-access/     # DB 접근 계층 (Prisma 쿼리 래핑)
│  │  ├─ categories/         # 카테고리 컴포넌트 (정적 메타데이터, DB 미사용)
│  │  │  ├─ entry-points/    # HTTP 요청을 받는 라우팅 계층
│  │  │  │  └─ api/
│  │  │  └─ domain/          # 카테고리 목록(id/라벨) 상수 — 색상은 프론트 담당
│  │  └─ debug/               # 개발용 디버그 컴포넌트 (DB 리셋/더미 시딩, 로컬 전용만 마운트)
│  │     ├─ entry-points/api/
│  │     ├─ domain/           # 더미 데이터 템플릿, 환경 마운트 여부 판단
│  │     └─ data-access/
│  └─ libraries/             # 컴포넌트 간 공용/범용 기능 (DB 클라이언트 등)
├─ prisma/
│  └─ migrations/            # DB 스키마 변경 이력
├─ generated/
│  └─ prisma/                # Prisma가 자동 생성하는 타입 안전 클라이언트 (git 제외)
└─ docs/                     # 아키텍처 문서 (다이어그램)
```

- **apps/** — 도메인(컴포넌트) 하나당 폴더 하나. 지금은 `receipts` 하나뿐이지만, 컴포넌트가 늘어나도 서로 독립적으로 확장 가능한 구조.
- **libraries/** — 특정 도메인에 속하지 않는 범용 기능(DB 클라이언트 싱글턴 등). 여러 컴포넌트가 공유.
- **entry-points / domain / data-access** — 각 컴포넌트 내부를 관심사별로 분리해, HTTP·DB 같은 기술적 디테일과 순수 비즈니스 로직을 섞지 않음.

## 사용자 데이터 분리 (로그인 없이)

로그인 기능은 없지만, 모든 사용자가 데이터를 공유하지는 않습니다. `/receipts` 하위 API는 요청마다 `X-Device-Id` 헤더(클라이언트가 최초 실행 시 생성해 저장해두는 UUID)를 요구하고, 서버는 모든 조회/수정/삭제를 해당 `deviceId`로 스코프합니다 — 헤더가 없으면 `400`, 다른 device가 만든 리소스에 접근하면 `404`.

⚠️ **진짜 인증은 아닙니다.** 헤더는 클라이언트가 임의로 바꿔 보낼 수 있어서 악의적인 접근을 막지는 못함 — 일반적인 사용(각자 자기 기기로 씀)에서 "내 영수증만 보인다"를 만족시키는 수준의 트레이드오프. 실제 계정/비밀번호 기반 인증이 필요해지면 `User` 모델 + 로그인 미들웨어로 교체하는 게 다음 확장 과제.

## 디버그 API (로컬 전용)

로컬 개발 중 앱 테스트 데이터를 빠르게 채우고 지우기 위한 API. `NODE_ENV=production`이면 라우터 자체가 마운트되지 않아 배포 서버(Render)에는 존재하지 않음 — 인증 없는 전체 삭제 API를 배포 환경에 노출하지 않기 위한 설계.

- `POST /debug/reset` — 모든 deviceId의 영수증을 전부 삭제
- `POST /debug/seed` — `{ "deviceId": "..." }`로 요청한 deviceId에 카테고리 6종·금액·날짜가 다양하게 분포된 더미 영수증 20건 생성

```bash
curl -X POST http://localhost:3000/debug/reset
curl -X POST http://localhost:3000/debug/seed -H 'Content-Type: application/json' -d '{"deviceId":"YOUR-DEVICE-ID"}'
```

**배포 서버(Render)에 더미 데이터를 채워야 할 때**: `/debug`는 프로덕션에 없으므로, 어느 환경에나 열려있는 공개 `POST /receipts`를 반복 호출해 같은 더미 데이터를 채우는 `scripts/seed-via-api.ts`를 대신 사용 (삭제 기능은 없음 — 프로덕션에서 전체 삭제 API 자체를 두지 않기로 한 설계와 일관됨).

```bash
npx tsx scripts/seed-via-api.ts YOUR-DEVICE-ID                                   # 기본값: 배포 URL
BASE_URL=http://localhost:3000 npx tsx scripts/seed-via-api.ts YOUR-DEVICE-ID    # 다른 환경 지정
```

## 실행

```bash
npm install
npm run dev     # 개발 서버 (파일 변경 감지)
npm start       # 프로덕션 실행
```

`DATABASE_URL` 환경변수 필요 — `.env.example`을 `.env`로 복사해서 사용 (예: `file:./dev.db`).

## API 문서

서버 실행 후 `/docs`에서 Swagger UI로 확인 가능 (예: `http://localhost:3000/docs`, 배포 환경은 `https://receipt-scanner-server-8ff7.onrender.com/docs`). `swagger-jsdoc`으로 각 라우트 파일의 JSDoc 주석에서 스펙을 생성하므로 코드와 문서가 어긋나지 않음. 스펙 원본은 `/openapi.json`.

## 아키텍처

구조/객체/시퀀스/유스케이스 다이어그램은 [docs/architecture.md](docs/architecture.md) 참고.
