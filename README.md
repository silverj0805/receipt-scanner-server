# receipt-scanner-server

영수증 스캔 가계부 앱의 백엔드 API 서버입니다. React Native 앱의 네이티브 모듈(TurboModule)이 온디바이스 OCR로 인식한 영수증 텍스트를 전달받아 가맹점명 기반으로 카테고리를 자동 분류하고 저장하며, 가계부 목록 조회와 대시보드 집계(이번 달 합계, 카테고리 비율, 전월 대비)를 제공합니다.

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
│  │  └─ receipts/           # 영수증 컴포넌트
│  │     ├─ entry-points/    # HTTP 요청을 받는 라우팅 계층
│  │     │  └─ api/
│  │     ├─ domain/          # 순수 비즈니스 로직 (카테고리 자동 분류 등)
│  │     └─ data-access/     # DB 접근 계층 (Prisma 쿼리 래핑)
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

## 실행

```bash
npm install
npm run dev     # 개발 서버 (파일 변경 감지)
npm start       # 프로덕션 실행
```

`DATABASE_URL` 환경변수 필요 (`.env` 참고, 예: `file:./dev.db`).

## 아키텍처

구조/객체/시퀀스/유스케이스 다이어그램은 [docs/architecture.md](docs/architecture.md) 참고.
