# 콘텐츠 검수 운영·배포 Runbook

## 배포 순서

1. `supabase db push`로 `content_moderation_foundation` migration을 적용한다.
2. Vercel Development·Preview·Production 환경을 분리한다. Preview에서는
   `MODERATION_GOOGLE_MODE=off`, Production은 초기 `shadow`로 둔다.
3. Production에 서로 다른 `MODERATION_OPS_SECRET`, `MODERATION_EVIDENCE_KEY_CURRENT`,
   `MODERATION_DECISION_KEY_SECRET`, `CRON_SECRET`을 설정한다. 모두 서버 전용이며
   `NEXT_PUBLIC_` 접두사를 사용하지 않는다.
4. Vercel Production OIDC principal이 GCP provider 조건과 service-account
   `roles/iam.workloadIdentityUser` 바인딩을 통과하는지 확인한다.
5. 아래 Vault·Cron SQL을 Supabase SQL Editor에서 값만 치환해 한 번 실행한다.
6. Telegram webhook을 `/api/telegram/moderation`에 연결하고 secret token을 설정한다.
7. 테스트 격리 글 1건으로 queue → Google → Telegram → 웹 검수 → 공개/거절을 검증한다.

## Supabase Cron 연결

URL과 secret은 migration이나 Git에 넣지 않고 Vault에 저장한다.

```sql
select vault.create_secret(
  'https://YOUR_PRODUCTION_DOMAIN/api/internal/moderation/worker',
  'moderation_worker_url'
);
select vault.create_secret('YOUR_CRON_SECRET', 'moderation_worker_cron_secret');

select cron.schedule(
  'content-moderation-worker',
  '30 seconds',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'moderation_worker_url'),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'moderation_worker_cron_secret'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 15000
  );
  $$
);
```

`pg_cron`, `pg_net`, Vault extension이 프로젝트에서 활성화되어 있어야 한다. 재등록 전에는
`select * from cron.job`으로 같은 이름의 job이 없는지 확인한다.

## Telegram webhook

Bot API `setWebhook` 호출 시 URL과 `secret_token=TELEGRAM_WEBHOOK_SECRET`을 설정한다.
허용 명령은 `/status`, `/queue`, `/help`뿐이다. 채팅 ID와 운영자 user ID가 모두 일치해야 하며,
Telegram에서 공개·거절·복구는 할 수 없다.

## 장애와 fail-safe

- Google 429·timeout·OIDC 실패: 케이스는 계속 비공개이고 수동 검수한다.
- 월 예상 $50: billing period당 Telegram 경고 1회.
- 월 예상 $100: 신규 Google 호출을 중지하며 규칙·격리·수동 검수는 유지한다.
- Telegram 실패: outbox가 지수 backoff로 재시도하며 웹 검수 목록이 source of truth다.
- evidence key 오류: 평문 fallback 없이 복호화를 거부한다.
- 12시간 내 미처리: 긴급 운영 알림 대상이지만 자동 공개·자동 삭제하지 않는다.
- 90일 경과: 암호화 증거가 삭제되므로 원문은 복구 불가하며 케이스가 자동 공개되지는 않는다.

## 키 회전

새 키를 `CURRENT`로 배포하기 전에 기존 current를 `PREVIOUS`로 복사하고 version도 함께 옮긴다.
새 글이 새 version으로 암호화되는지 확인한다. 이전 version evidence의 90일 보존 기간이 모두
끝난 뒤에만 previous key를 제거한다. 운영 인증 키와 evidence key는 절대 재사용하지 않는다.
