# 후보자 대시보드 성능 전환 Runbook

## 현재 상태

- `20260808231753_candidate_dashboard_performance_foundation.sql` 적용 완료
- `20260808235524_candidate_legacy_location_compatibility.sql` 적용 완료
- 활성 후보자 coverage seed 적용 완료
- strict DB 검증 통과
- 새 읽기·원자 답변·비동기 알림 경로는 환경 변수로 분리되어 있음
- 활성 후보자 수 × 3을 최대 동시 후보자 세션 검증 기준으로 사용함

기존 읽기 경로는 `CANDIDATE_INBOX_READ_ENABLED=false`인 동안 그대로 유지된다.

## 배포 전 서버 환경 변수

다음 값은 모두 서버 전용이며 `NEXT_PUBLIC_` 접두사를 붙이지 않는다.

```text
CANDIDATE_INBOX_READ_ENABLED=false
CANDIDATE_ATOMIC_REPLY_ENABLED=false
REPLY_NOTIFICATION_ASYNC_ENABLED=false
CANDIDATE_MFA_REQUIRED=false
CANDIDATE_WORKER_CRON_SECRET=<서로 다른 64자리 hex 값>
REPLY_NOTIFICATION_FROM=<검증된 발신자>
REPLY_NOTIFICATION_BASE_URL=https://herebtw.vercel.app
```

`CANDIDATE_WORKER_CRON_SECRET`은 기존 moderation·ops·evidence 키와 재사용하지 않는다.

## 검증 명령

```powershell
npm run candidate:coverage:dry-run
npm run candidate:verify:strict
npm run candidate:benchmark -- --rounds=10
npm run typecheck
npm run build
npm run smoke:api
npm run guard:architecture
```

`candidate:verify:strict`은 다음 조건에서 실패한다.

- 현재 coverage가 없는 활성 후보자
- canonical area가 없는 공개 가능 시민 글
- 라우팅 dead job
- dashboard counter drift
- 알림 dead job
- 아직 처리되지 않은 routing·priority·notification backlog

## 알림 worker 연결

URL과 secret을 Git이나 migration에 기록하지 않고 Supabase Vault에 넣는다.

```sql
select vault.create_secret(
  'https://YOUR_PRODUCTION_DOMAIN/api/internal/reply-notifications/worker',
  'candidate_reply_worker_url'
);

select vault.create_secret(
  'YOUR_64_CHARACTER_CANDIDATE_WORKER_SECRET',
  'candidate_reply_worker_secret'
);

select cron.schedule(
  'candidate-reply-notification-worker',
  '30 seconds',
  $$
  select net.http_post(
    url := (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'candidate_reply_worker_url'
    ),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'candidate_reply_worker_secret'
      ),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 15000
  );
  $$
);
```

동일한 이름의 job이 있으면 먼저 `cron.unschedule(jobid)`로 제거한다. worker는 인증을 먼저 검사하고, `REPLY_NOTIFICATION_ASYNC_ENABLED=false`이면 인증된 요청에도 404를 반환한다.

## 플래그 전환 순서

1. 모든 플래그가 `false`인 코드부터 배포한다.
2. `candidate:verify:strict`와 후보자 수 × 3 benchmark를 통과시킨다.
3. worker URL·64자리 secret·발신자를 설정하고 Cron을 등록한다.
4. 한 배포에서 `CANDIDATE_ATOMIC_REPLY_ENABLED=true`와 `REPLY_NOTIFICATION_ASYNC_ENABLED=true`를 함께 설정한다.
5. 테스트 답변 한 건으로 reply 저장, outbox claim, Resend 전송, `sent` 상태를 확인한다.
6. `CANDIDATE_INBOX_READ_ENABLED=true`로 바꿔 테스트 후보자부터 새 목록을 확인한다.
7. 후보자가 `/auth/mfa`에서 TOTP 등록과 로그인을 검증한 뒤 `CANDIDATE_MFA_REQUIRED=true`로 바꾼다.
8. 7일 동안 오류율·p95·queue backlog·counter drift를 관찰한다.

비동기 flag만 단독으로 켜도 legacy 답변 경로는 동기 이메일을 계속 보내므로 알림이 유실되지 않는다. 원자 답변 경로는 답변과 outbox를 한 트랜잭션에 기록한다.

## 장애 시 되돌리기

- 목록 이상: `CANDIDATE_INBOX_READ_ENABLED=false`
- 원자 답변 이상: `CANDIDATE_ATOMIC_REPLY_ENABLED=false`
- 알림 worker 이상: `REPLY_NOTIFICATION_ASYNC_ENABLED=false` 후 Cron 중지
- MFA 접근 장애: `CANDIDATE_MFA_REQUIRED=false`

플래그 rollback은 신규 테이블과 큐 데이터를 삭제하지 않는다. 답변이 outbox에 이미 들어갔다면 worker 복구 후 이어서 처리한다.

## 운영 점검

```powershell
npm run candidate:verify
```

경고가 있으면 backlog가 감소하는지 1분 간격으로 다시 확인한다. 감소하지 않거나 dead job이 생기면 읽기 플래그를 유지한 채 원인을 먼저 조사한다. 후보자가 인증 앱을 분실한 경우 운영자가 Supabase Auth에서 해당 사용자의 TOTP factor를 제거한 뒤 다시 등록하게 한다.
