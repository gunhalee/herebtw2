# LLM Maintenance Guide

이 문서는 이 저장소를 유지보수하거나 기능을 추가할 때, LLM/에이전트가 빠르게 구조를 파악하고 안전하게 수정할 수 있도록 만든 작업 가이드다.

## 1. 제품 요약

- 이 프로젝트는 Next.js App Router 기반의 익명 지역 피드 앱이다.
- 현재 사용자 진입점은 사실상 홈 한 화면이다.
- 핵심 흐름은 `피드 조회`, `현재 위치 확인`, `글 작성`, `공감`, `신고`다.
- 서버 설정이 있으면 `supabase` 모드, 없으면 `mock` 모드로 동작한다.

## 2. 먼저 읽을 파일

변경 전에 아래 파일을 먼저 읽으면 전체 구조를 빠르게 잡을 수 있다.

### 화면 진입

- `src/app/(public)/page.tsx`
- `src/lib/posts/queries.ts`
- `src/components/home/home-screen.tsx`

### 홈 화면 로직

- `src/components/home/use-home-shell-state.ts`
- `src/components/home/use-home-feed-lifecycle.ts`
- `src/components/home/use-home-feed-list-actions.ts`
- `src/components/home/use-home-post-actions.ts`
- `src/components/home/use-home-compose-flow.ts`

### 작성 시트 로직

- `src/components/post/post-compose-experience.tsx`
- `src/components/post/post-compose-sheet-shell.tsx`
- `src/components/post/post-compose-form.tsx`
- `src/components/post/use-compose-location.ts`
- `src/components/post/use-compose-sheet-layout.ts`
- `src/components/post/use-compose-submit.ts`

### 서버/도메인 로직

- `src/app/api/**/route.ts`
- `src/lib/candidates/mutations.ts`
- `src/lib/posts/mutations.ts`
- `src/lib/posts/repository.ts`
- `src/lib/posts/repository/feed.ts`
- `src/lib/posts/repository/feed-preparation.ts`
- `src/lib/posts/repository/feed-list-loaders.ts`
- `src/lib/posts/repository/feed-snapshot.ts`
- `src/lib/posts/repository/mutations.ts`

### 공통 API/위치 유틸

- `src/lib/api/client.ts`
- `src/lib/api/response.ts`
- `src/lib/geo/resolve-location.ts`
- `src/lib/geo/location-resolution-token.ts`
- `src/lib/posts/engagement-snapshot-token.ts`

## 3. 현재 아키텍처 원칙

### 3-1. 화면 코드는 조립 중심으로 유지한다

- `home-screen.tsx`는 화면 조립과 hook 연결만 담당한다.
- 세부 로직은 `use-home-*` hook과 `home-*.ts` helper로 분리돼 있다.
- 작성 시트도 `post-compose-experience.tsx`는 UI 조립 중심이고, 위치/레이아웃/제출은 `use-compose-*`로 나뉜다.
- 입력 UI는 `post-compose-form.tsx`, 오버레이/시트 컨테이너는 `post-compose-sheet-shell.tsx`로 분리돼 있다.
- 홈 화면에서는 compose 패널을 `next/dynamic`으로 지연 로딩한다.

### 3-2. API route는 얇게 유지한다

- `src/app/api/**/route.ts`는 request 파싱, 최소 검증, 응답 포맷팅에 집중한다.
- business logic은 route에 두지 말고 `src/lib/posts/*`, `src/lib/geo/*`로 내린다.
- 후보자 write flow처럼 여러 Supabase 호출이 묶이는 작업은 `src/lib/candidates/mutations.ts` 같은 use-case 함수로 모은다.
- 응답은 가능하면 `ok(...)`, `fail(...)` helper를 재사용한다.
- client component의 `/api/*` 호출은 가능하면 `src/components/**/**-api.ts` 또는 `fetchClientApiData(...)` helper를 통해 모은다.
- server의 Supabase REST write는 route에서 직접 `fetch(...)`하지 말고 `src/lib/supabase/rest.ts` helper를 통해서만 호출한다.

### 3-3. posts 도메인은 repository 아래에 모아둔다

- `src/lib/posts/repository/feed.ts`: 피드 오케스트레이션, nearby/global 진입점
- `src/lib/posts/repository/feed-preparation.ts`: RPC 준비, cursor 해석, fallback 결정
- `src/lib/posts/repository/feed-list-loaders.ts`: rpc/legacy list state 조립
- `src/lib/posts/repository/feed-snapshot.ts`: engagement/report snapshot 조회
- `src/lib/posts/repository/mutations.ts`: 작성, 공감, 신고, 디바이스 sync
- `src/lib/posts/repository/feed-helpers.ts`: cursor, metrics, item mapping
- `src/lib/posts/mutations.ts`: route와 repository 사이의 얇은 use-case layer

### 3-4. mock 모드를 유지한다

- Supabase 설정이 없을 때도 앱이 깨지지 않아야 한다.
- 새로운 기능을 추가할 때는 `supabase` 경로만 구현하지 말고 `mock` fallback도 함께 점검한다.

## 4. 주요 데이터 흐름

### 4-1. 홈 피드

1. `src/app/(public)/page.tsx`
2. `getPublicHomePageShellState()`
3. `HomeStaticScreen` / `HomeScreenBootstrap`
4. `useHomeShellState` / `useHomeFeedLifecycle`
5. `home-feed-api.ts`
6. `/api/feed/*`
7. `src/lib/posts/repository/feed.ts`
8. 필요 시 `feed-preparation.ts` / `feed-list-loaders.ts` / `feed-snapshot.ts`

### 4-2. 글 작성

1. `PostComposeExperience`
2. `useComposeLocation`에서 현재 위치 + 행정동 확인
3. `useComposeSubmit`에서 `/api/posts` 호출
4. `/api/posts/route.ts`
5. `src/lib/posts/mutations.ts`
6. `src/lib/posts/repository/mutations.ts`

### 4-3. 공감/신고

1. `use-home-agree-actions.ts` / `use-home-report-actions.ts`
2. `home-post-api.ts`
3. `/api/posts/[postId]/agree/toggle`, `/api/posts/[postId]/report`
4. `src/lib/posts/mutations.ts` 또는 repository mutation

## 5. 최근 성능/안정화 결정

다음 결정들은 되도록 유지하는 편이 좋다.

### 5-1. 위치 해석 중복 제거

- 클라이언트는 `/api/location/resolve`에서 받은 `locationResolutionToken`을 `/api/posts`에 함께 보낸다.
- 서버는 토큰이 유효하면 reverse geocode를 다시 하지 않는다.
- 토큰이 없거나 검증이 실패하면 기존 fallback으로 다시 위치를 해석한다.

관련 파일:

- `src/lib/geo/location-resolution-token.ts`
- `src/app/api/location/resolve/route.ts`
- `src/app/api/posts/route.ts`

### 5-2. 클라이언트 API timeout

- `src/lib/api/client.ts`의 `fetchClientApiData`는 기본 8초 timeout이 있다.
- 사용자 체감이 중요한 요청은 `timeoutErrorMessage`를 별도로 준다.
- 새로운 client-side fetch를 추가할 때는 raw `fetch`보다 이 helper를 우선 사용한다.

### 5-3. polling backoff

- visibility polling은 `setInterval`이 아니라 `setTimeout + backoff` 기반이다.
- 실패 시 간격이 늘어나고, 콘솔에 경고가 남는다.
- polling 빈도를 늘릴 때는 서버 부하와 트래픽 비용을 먼저 확인한다.

관련 파일:

- `src/lib/hooks/use-visible-polling.ts`
- `src/components/home/use-home-feed-lifecycle.ts`

### 5-4. engagement sync payload 축소

- `/api/posts/engagement`는 `snapshotToken`이 같으면 `204 No Content`를 반환한다.
- 클라이언트는 현재 아이템 목록으로 토큰을 만들어 보내고, 변경이 있을 때만 body를 받는다.

관련 파일:

- `src/lib/posts/engagement-snapshot-token.ts`
- `src/app/api/posts/engagement/route.ts`
- `src/components/home/home-feed-sync.ts`

## 6. 기능 추가 시 권장 진입점

### 6-1. 홈 화면 UI만 바꾸는 경우

- `src/components/home/dong-posts-screen.tsx`
- `src/components/home/dong-posts-feed.tsx`
- `src/components/home/dong-posts-header.tsx`
- `src/components/sheet/*`

로직까지 바뀌면 먼저 `use-home-*` hook에서 처리 가능한지 본다.

### 6-2. 홈 화면 행동이 추가되는 경우

예: 새 메뉴 액션, 새 피드 상호작용

- UI: `dong-posts-screen.tsx`, `post-list-item*.tsx`
- client API: `home-post-api.ts` 또는 `home-feed-api.ts`
- action hook: `use-home-post-actions.ts` 하위 hook
- server route: `src/app/api/...`
- domain logic: `src/lib/posts/...`

### 6-2-1. 후보자/부가 client fetch는 candidate API 파일로 모은다

- 후보자 관련 client-side 호출은 `src/components/candidate/*-api.ts`를 우선 본다.
- route가 세션에서 이미 아는 값은 client request body에 중복으로 보내지 않는다.
- 예: `candidateId`를 화면 props에서 다시 내려보내기보다 route 내부 세션을 신뢰한다.

### 6-3. 작성 시트 기능이 추가되는 경우

예: 글 제한, 첨부 정보, 작성 규칙

- UI entry: `post-compose-experience.tsx`
- form UI: `post-compose-form.tsx`
- sheet shell: `post-compose-sheet-shell.tsx`
- 위치/상태: `use-compose-location.ts`
- 제출: `use-compose-submit.ts`
- server validation: `src/lib/posts/mutations.ts`, `src/lib/posts/validators.ts`

### 6-4. 피드 조회 조건이나 정렬이 바뀌는 경우

- route query parsing: `src/app/api/feed/*/route.ts`
- client request builder: `src/components/home/home-feed-api.ts`
- repository entry: `src/lib/posts/repository/feed.ts`
- rpc/cursor/fallback: `src/lib/posts/repository/feed-preparation.ts`
- rpc/legacy state assembly: `src/lib/posts/repository/feed-list-loaders.ts`
- snapshot/engagement query: `src/lib/posts/repository/feed-snapshot.ts`
- cursor/metrics/mapping: `src/lib/posts/repository/feed-helpers.ts`

## 7. 수정 시 지켜야 할 규칙

### 7-1. 이미 삭제한 경로를 다시 만들지 않는다

다음은 의도적으로 정리된 레이어다.

- 얇은 posts action wrapper (`src/actions/posts/*`)
- 사용되지 않던 write route
- UI에서 타지 않던 예전 posts endpoint 일부

비슷한 파일을 다시 만들기 전에, 정말 필요한 레이어인지 먼저 확인한다.

### 7-2. route에서 UI 상태 타입을 직접 다루지 않는다

- `PostComposeState` 같은 UI 상태 타입은 client 컴포넌트 내부에 머무는 편이 맞다.
- route와 repository는 서버 입력/출력 타입으로 소통한다.

### 7-3. 반복 polling 응답은 가능하면 작게 유지한다

- full snapshot을 계속 보내기보다 `204`, token, delta, ETag류 전략을 먼저 검토한다.
- 같은 기능을 유지하면서 트래픽을 줄일 수 있으면 그 방향을 우선한다.

### 7-4. mock/supabase parity를 의식한다

- mock에서만 되는 흐름, supabase에서만 되는 흐름이 생기지 않도록 주의한다.
- API smoke 시 mock post id는 UUID가 아닐 수 있다.
- 특히 `/api/posts/engagement`는 UUID만 받으므로 mock smoke 시엔 dummy UUID를 넣어야 한다.

### 7-5. API 접근 경로를 새로 흩뜨리지 않는다

- UI에서 raw `fetch("/api/...")`를 새로 추가하기 전에 기존 `*-api.ts` 파일이 있는지 먼저 본다.
- 새 client-side write 요청은 `createJsonPostRequestInit(...)`, `createJsonPatchRequestInit(...)` 같은 공용 helper를 우선 사용한다.
- route 안에서 `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`를 직접 조합하는 코드는 만들지 않는다.

## 8. 문구 수정 규칙

- 사용자-facing copy를 바꿨다면 `docs/copy-review.md`도 같이 갱신하는 편이 좋다.
- 갱신 명령:

```bash
npm run generate:copy-review
```

- 생성 문서는 `docs/copy-review.md`다.

## 9. 검증 루틴

코드 변경 후 최소한 아래는 확인한다.

```bash
npm run typecheck
npm run build
```

가능하면 추가로 아래도 본다.

```bash
npx tsc --noEmit --noUnusedLocals --noUnusedParameters
```

## 10. Candidate screen composition

- `src/components/candidate/dashboard-screen.tsx` should stay as a composition entry point.
- Move first-message editing state into `use-candidate-first-message-editor.ts`.
- Keep dashboard sections split across:
  - `candidate-dashboard-header.tsx`
  - `candidate-first-message-panel.tsx`
  - `candidate-dashboard-stats-grid.tsx`
  - `candidate-dashboard-post-list.tsx`
- `src/components/candidate/reply-compose-screen.tsx` should compose:
  - `candidate-reply-form.tsx`
  - `candidate-reply-confirm-dialog.tsx`
  - `use-candidate-reply-compose.ts`
- `src/components/candidate/onboarding-screen.tsx` should compose:
  - `candidate-onboarding-form.tsx`
  - `use-candidate-onboarding.ts`
- If a new candidate flow needs API access, use the existing `candidate-*-api.ts` helpers instead of raw `fetch("/api/...")` inside the screen file.

## 11. Home feed sync budget

- `src/lib/hooks/use-visible-polling.ts` now supports activity-aware polling intervals.
- Home feed polling should stay on a stepped schedule:
  - active: 20s
  - idle for 1m+: 30s
  - idle for 3m+: 60s
- `src/components/home/home-feed-sync.ts` should sync only the leading feed window by default instead of every loaded post id.
- `src/app/api/posts/engagement/route.ts` and `src/app/api/feed/nearby/sync/route.ts` should prefer `204 No Content` when there is no meaningful delta to send back.

## 12. Initial load budget

- `src/app/(public)/page.tsx` should load only the minimum state needed for the first home render.
- Candidate message data should not block the home page response.
- `src/components/home/dong-posts-feed.tsx` should lazy-load `candidate-messages-section.tsx`, and only after a concrete `dongCode` is available.
- `src/lib/candidates/messages.ts` should stay behind server-side caching because it is now primarily a deferred API source.
- In candidate client screens, prefer App Router navigation (`next/link`, `router.push`, `router.replace`) over `window.location.href` for in-app transitions.

주의:

- `npm run typecheck`는 내부적으로 `next typegen`을 먼저 실행한다.
- route/page/layout 타입이 갱신되지 않은 상태라면 `npm run build` 또는 `npm run typegen` 후 다시 확인한다.

## 10. API smoke 테스트 팁

- Supabase write를 건드리고 싶지 않으면 mock 모드로 smoke 테스트를 돌린다.
- 최근 자주 확인한 엔드포인트:
  - `/api/feed/global`
  - `/api/feed/nearby`
  - `/api/feed/nearby/sync`
  - `/api/location/resolve`
  - `/api/posts`
  - `/api/posts/[postId]/agree/toggle`
  - `/api/posts/[postId]/report`
  - `/api/posts/engagement`

특히 아래는 회귀 체크 포인트다.

- `/api/posts` malformed JSON -> `400`
- `/api/location/resolve` -> `locationResolutionToken` 포함
- `/api/posts/engagement` -> 같은 `snapshotToken` 재호출 시 `204`

## 11. 알려진 함정

### 11-1. PowerShell 출력과 실제 파일 인코딩이 다르게 보일 수 있다

- 콘솔에서 한글이 깨져 보여도 파일 자체가 잘못됐다고 단정하지 않는다.
- 브라우저 렌더링, 빌드 결과, `docs/copy-review.md`를 함께 확인한다.

### 11-2. global feed는 서버 캐시를 사용한다

- `src/lib/posts/queries.ts`와 `/api/feed/global`은 revalidate/s-maxage를 사용한다.
- 즉시 반영이 꼭 필요한 기능이면 캐시 경계를 먼저 검토한다.

### 11-3. nearby feed는 브라우저 캐시도 사용한다

- `src/lib/posts/browser-nearby-post-cache.ts`
- bootstrap 시 cached nearby feed를 먼저 보여주고, 이후 hydrate/sync한다.

## 12. 추천 작업 순서

새 작업을 시작할 때는 보통 아래 순서가 안전하다.

1. 관련 화면/route/repository 파일 확인
2. 변경이 UI인지, API인지, 도메인인지 경계 결정
3. 가능한 한 기존 helper/hook 재사용
4. mock/supabase 둘 다 깨지지 않는지 확인
5. `npm run typecheck`
6. `npm run build`
7. copy를 바꿨다면 `npm run generate:copy-review`

## 13. 이 문서를 업데이트해야 하는 경우

아래 변화가 생기면 이 문서도 같이 갱신하는 편이 좋다.

- 큰 구조 변경
- 새로운 핵심 route 추가/삭제
- data flow 변경
- 새로운 캐시 전략 또는 polling 전략 도입
- 유지보수 규칙 변경
