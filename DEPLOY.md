# Shout Deployment Guide

## 1. Supabase project 준비

이 프로젝트는 아래 환경변수를 사용합니다.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

루트에서 `.env.example`을 복사해 `.env.local`을 만든 뒤 값을 채워 주세요.

```powershell
Copy-Item .env.example .env.local
```

참고:

- Supabase의 최신 Next.js 가이드는 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`를 예시로 보여 주지만, 현재 이 코드베이스는 `src/lib/supabase/config.ts`에서 `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 읽도록 되어 있습니다.
- Supabase 문서상 기존 `anon` / `service_role` 키는 전환 기간 동안 계속 사용할 수 있습니다.

## 2. DB 마이그레이션 적용

### CLI 권장 방식

Supabase CLI를 이미 쓰고 있다면 아래 순서가 가장 깔끔합니다.

```powershell
supabase login
supabase link
supabase db push
```

이 프로젝트의 마이그레이션은 `supabase/migrations`에 순서대로 들어 있습니다.

`supabase link --project-ref <your-project-ref>` 형태로 직접 연결해도 됩니다.

### 대시보드 수동 적용

CLI를 아직 안 쓰는 경우에는 Supabase SQL Editor에서 아래 파일을 순서대로 실행해도 됩니다.

1. `supabase/migrations/20260405174500_enable_pgcrypto.sql`
2. `supabase/migrations/20260405174600_create_mvp1_core_tables.sql`
3. `supabase/migrations/20260405174700_create_mvp1_indexes.sql`
4. `supabase/migrations/20260405174800_create_mvp1_functions_and_views.sql`

## 3. 로컬 실행

```powershell
npm install
npm run dev
```

정상 연결되면:

- 홈 `/` 은 동적 피드로 동작합니다.
- `/write` 에서 실제 POST 저장이 됩니다.
- 신고 reason code는 DB 제약조건에 맞는 `other_policy`로 전송됩니다.
- 환경변수가 없으면 홈/글쓰기에서 샘플 모드 안내가 보입니다.

## 4. Vercel 배포

### 기본 방식

1. Vercel에 프로젝트를 import 합니다.
2. Project Settings > Environment Variables 에 아래 3개를 넣습니다.
3. 최소 `Production` 과 `Preview` 둘 다 같은 값을 넣는 것을 권장합니다.
4. 저장 후 새 배포를 발생시킵니다.

필수 변수:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

주의:

- Vercel 문서상 환경변수 변경은 이전 배포에 소급 적용되지 않고, 새 배포부터 반영됩니다.
- 로컬에서 Vercel 환경변수를 당겨오려면 `vercel env pull`을 사용할 수 있습니다.

### Supabase Vercel Marketplace

원하면 Supabase Vercel Marketplace 연동을 써서 환경변수를 자동 동기화할 수도 있습니다. 다만 공식 문서 기준 현재는 Public Alpha로 표시되어 있습니다.

## 5. 배포 후 체크리스트

1. 홈에서 샘플 모드 배너가 사라졌는지 확인
2. `/write` 에서 글 등록 후 홈으로 돌아왔을 때 새 글이 보이는지 확인
3. 공감 토글이 반영되는지 확인
4. 신고가 한 번만 들어가는지 확인
5. Supabase Table Editor에서 `device_identities`, `posts`, `post_reactions`, `post_reports` 데이터가 쌓이는지 확인

## 공식 문서

- Supabase Next.js quickstart: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- Supabase database migrations: https://supabase.com/docs/guides/deployment/database-migrations
- Supabase Vercel Marketplace: https://supabase.com/docs/guides/integrations/vercel-marketplace
- Vercel environment variables: https://vercel.com/docs/environment-variables
