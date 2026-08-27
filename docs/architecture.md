# 아키텍처 문서

`receipt-scanner-server`의 구조/데이터/흐름을 정리한 다이어그램 모음.

## 1. 구조 다이어그램 (Class Diagram)

`entry-points`(라우팅) → `domain`(순수 로직) / `data-access`(DB 접근) → `libraries`(Prisma 싱글턴) → `Receipt` 순으로 의존.

```mermaid
classDiagram
    class receiptsRouter {
        <<entry-points/api>>
        +POST /
        +GET /
        +GET /summary
        +GET /:id
        +PATCH /:id
        +DELETE /:id
    }

    class summaryUtil {
        <<domain>>
        +buildSummary(thisMonth, lastMonth) Summary
        +getMonthRanges(now) DateRanges
    }

    class receiptsRepository {
        <<data-access>>
        +createReceipt(data) Receipt
        +findAllReceipts(deviceId, take, skip) Receipt[]
        +findReceiptsByDateRange(deviceId, start, end) Receipt[]
        +findReceiptById(deviceId, id) Receipt?
        +updateReceipt(deviceId, id, data) Receipt?
        +deleteReceipt(deviceId, id) bool
    }

    class prisma {
        <<libraries>>
        +receipt
    }

    class Receipt {
        +Int id
        +String deviceId
        +String merchant
        +String? itemName
        +Int amount
        +String category
        +String? rawText
        +DateTime date
        +DateTime createdAt
    }

    class categoriesRouter {
        <<entry-points/api, apps/categories>>
        +GET /
    }

    class categoryConstants {
        <<domain, apps/categories>>
        +CATEGORIES: Category[]
    }

    receiptsRouter --> summaryUtil : uses
    receiptsRouter --> receiptsRepository : uses
    receiptsRepository --> prisma : uses
    prisma --> Receipt : persists
    categoriesRouter --> categoryConstants : uses
```

`categoriesRouter`는 `receipts`와 별개 컴포넌트(`apps/categories/`)로 분리 — DB에 의존하지 않는 정적 메타데이터(라벨/색상)만 반환하므로 `data-access` 계층 없이 `entry-points`+`domain`만 존재.

## 2. 객체 다이어그램 (Object Diagram)

실제 저장되는 데이터 예시.

```mermaid
classDiagram
    class r1["r1 : Receipt"] {
        id = 1
        merchant = "스타벅스 강남점"
        itemName = "아메리카노"
        amount = 12400
        category = "food"
        date = 2026-08-20
    }
    class r2["r2 : Receipt"] {
        id = 2
        merchant = "카카오T"
        amount = 9200
        category = "transit"
        date = 2026-08-18
    }
    class r3["r3 : Receipt"] {
        id = 3
        merchant = "올리브영"
        amount = 34200
        category = "shop"
        date = 2026-08-19
    }
```

## 3. 행위 다이어그램 (Sequence Diagram)

### 3-1. 영수증 등록 흐름 (앱 + 네이티브 + 백엔드 전체 연결)

```mermaid
sequenceDiagram
    actor U as 사용자
    participant App as RN App (app/)
    participant Native as NativeReceiptScanner (TurboModule)
    participant API as receiptsRouter
    participant Repo as receipts.repository
    participant DB as SQLite (Prisma)

    U->>App: 영수증 촬영/선택
    App->>Native: scanText(imageUri)
    Native-->>App: rawText (OCR 결과)
    App->>App: 정규식으로 금액/날짜 1차 파싱
    U->>App: 카테고리 칩 선택 후 저장하기
    App->>API: POST /receipts (X-Device-Id 헤더) { merchant, itemName?, amount, category, rawText, date }
    API->>Repo: createReceipt(data)
    Repo->>DB: INSERT Receipt
    DB-->>Repo: 저장된 Receipt
    Repo-->>API: Receipt
    API-->>App: 201 Created + Receipt
    App-->>U: 저장 완료 → 리스트로 이동
```

### 3-2. 홈 대시보드 조회 흐름

```mermaid
sequenceDiagram
    actor U as 사용자
    participant App as RN App
    participant API as receiptsRouter
    participant Repo as receipts.repository
    participant Sum as summary.util

    U->>App: 홈 화면 진입
    App->>API: GET /receipts/summary (X-Device-Id 헤더)
    API->>Repo: findReceiptsByDateRange(deviceId, 이번달), findReceiptsByDateRange(deviceId, 지난달)
    Repo-->>API: Receipt[], Receipt[]
    API->>Sum: buildSummary(thisMonth, lastMonth)
    Sum-->>API: { total, deltaPercent, byCategory[] }
    API-->>App: 200 OK + summary
    App-->>U: 대시보드 렌더링
```

## 4. 유스케이스 다이어그램

```mermaid
flowchart LR
    U((사용자))
    subgraph 영수증 가계부 시스템
        UC1[영수증 등록]
        UC2[영수증 목록 조회]
        UC3[영수증 상세 조회]
        UC4[영수증 수정]
        UC5[영수증 삭제]
        UC6[대시보드 요약 조회]
        UC7[카테고리별 필터링]
        UC8[카테고리 목록 조회]
    end
    U --- UC1
    U --- UC2
    U --- UC3
    U --- UC4
    U --- UC5
    U --- UC6
    U --- UC7
    U --- UC8
```

## 5. ERD

```mermaid
erDiagram
    RECEIPT {
        int id PK
        string deviceId "로그인 없이 X-Device-Id 헤더로 스코프"
        string merchant
        string itemName "선택 입력 — 무엇을 샀는지"
        int amount
        string category
        string rawText
        datetime date
        datetime createdAt
    }
```

향후 확장 시(카테고리를 별도 테이블로 정규화):

```mermaid
erDiagram
    RECEIPT {
        int id PK
        string merchant
        int amount
        int categoryId FK
        string rawText
        datetime date
        datetime createdAt
    }
    CATEGORY {
        int id PK
        string name
        string colorHex
    }
    RECEIPT }o--|| CATEGORY : belongs_to
```
