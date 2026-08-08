# 콘텐츠 moderation 외부 서비스 준비 체크리스트

문서 상태: **실행 체크리스트 / 결제 범위 확정**

기준일: **2026-08-09**

책임자: **이건하**

관련 설계: [콘텐츠 안전·유해 표현 탐지 구현 설계 및 실행 계획](./content-moderation-implementation-plan.md)

## 1. 결론

초기 신규 결제는 **Google Cloud Natural Language만 활성화**한다. 다음 항목은 별도 신규 결제 없이
준비하거나, 명확한 production gate가 올 때까지 유예한다.

| 항목 | 지금 결제 | 지금 할 일 | 유예 종료 시점 |
| --- | --- | --- | --- |
| Google Cloud Natural Language | 활성화 | 전용 프로젝트·API·예산·service account 준비 | 즉시 |
| Telegram bot·비공개 채널 | 결제 없음 | 지금 생성 | 운영 알림 통합 테스트 전 |
| 64-hex 운영 인증 | 결제 없음 | 서로 다른 운영·evidence secret 생성 | 운영 도구 production 활성화 전 |
| Hugging Face managed endpoint | 유예 | 계정·후보 모델만 기록, 로컬 benchmark | 확장 trigger 충족 후 |
| Evidence 암호화 | 결제 없음 | Vercel Sensitive Environment Variable과 AES-256-GCM 구현 | production evidence 수집 전 |
| Supabase·Vercel 상위 요금제 | 유예 | 기존 quota 모니터링 | 실제 사용량·SLO가 현재 quota를 초과하기 전 |
| 법률 자문 | 유예 가능 | 개인정보 처리방침 초안과 질문 목록 작성 | 공개 출시 전 |

이 유예안의 초기 production 판정은 deterministic rule, 기존 어뷰징 방어, Google의 제한된 보조
판정, 보수적 quarantine과 수동 검수로 구성한다. Hugging Face endpoint가 없을 때 로컬 모델이
production 주 판별기인 것처럼 간주하거나 모델 기반 auto-block을 활성화해서는 안 된다.

## 2. 절대 유예하면 안 되는 경계

- Telegram과 64-hex 운영 인증은 유료 준비가 아니므로 운영 도구 production 공개 전에 완료한다.
- critical·quarantine 원문을 production에서 보존하기 전에 운영 인증 key와 별개의 64-hex
  evidence key, AES-256-GCM, key version과 90일 cleanup을 구현한다.
- 운영·evidence key는 Vercel Production의 Sensitive Environment Variable로 설정하고 Preview와
  Production에서 서로 다른 값을 사용한다.
- 개인정보 처리방침 법률 검토는 개발 중에는 미룰 수 있지만 공개 출시 이후로 미루지 않는다.
- Google Cloud budget alert는 지출을 자동 차단하지 않으므로 `$100` hard stop은 애플리케이션
  내부의 검증된 과금 unit counter로 별도 강제한다.
- Google 또는 local model이 없거나 장애여도 명백 규칙 차단과 애매한 글의 quarantine은 유지한다.

## 3. 단계별 체크리스트

### A. 지금 준비: 계정 소유권과 secret 보관

- [ ] 운영 전용 이메일 계정을 확정한다.
- [ ] 비밀번호 관리자와 오프라인 복구 정보 보관 위치를 정한다.
- [ ] Google, Supabase dashboard, Hugging Face, Telegram 운영 계정 자체에 가능한 MFA를 켠다.
- [ ] token, 운영 secret, evidence key, service-account credential을 Git·문서·Telegram에 남기지
      않는 규칙을 기록한다.
- [ ] development, preview, production secret을 서로 분리하기로 확정한다.

완료 증거:

- secret의 실제 값이 아닌 소유자·용도·rotation 예정일만 기록한 inventory
- 계정 복구 담당자: 이건하

### B. 지금 준비: Telegram 모니터링

- [ ] `@BotFather`에서 moderation 알림 전용 bot을 만든다.
- [ ] 비공개 monitoring channel을 만들고 일반 공개 채널과 분리한다.
- [ ] bot에는 가능한 한 메시지 게시 권한만 부여한다.
- [ ] 테스트 메시지로 channel ID를 확인한다.
- [ ] 이건하 Telegram user ID를 확인해 allowlist 값으로 기록한다.
- [ ] 32자 이상의 webhook secret을 생성해 비밀번호 관리자에 보관한다.
- [ ] Telegram 장애 시 공개 채널 fallback을 사용하지 않는 것을 확인한다.

기록할 값:

```text
TELEGRAM_MONITOR_CHANNEL_ID     # 비밀 아님
TELEGRAM_OPERATOR_USER_IDS      # 비밀 아님, 공개 문서에는 넣지 않음
TELEGRAM_BOT_USERNAME           # 비밀 아님
TELEGRAM_BOT_TOKEN              # secret
TELEGRAM_WEBHOOK_SECRET         # secret
```

bot token과 webhook secret의 실제 값은 이 체크리스트에 적지 않는다.

### C. 지금 결제: Google Cloud Natural Language

- [ ] moderation 전용 Google Cloud 프로젝트를 생성한다.
- [ ] 결제 계정을 이 프로젝트에 연결한다.
- [ ] Cloud Natural Language API를 활성화한다.
- [ ] production runtime 전용 service account를 만든다.
- [ ] 개인 관리자 계정, API 활성화 관리자, production runtime identity를 분리한다.
- [ ] 개발 환경에서는 별도 자격증명 또는 Application Default Credentials를 사용한다.
- [ ] production 자격증명은 server-only로 저장하고 브라우저 bundle에 포함하지 않는다.
- [ ] `moderateText` test fixture 한 건으로 인증·응답 형식·한국어 category를 확인한다.
- [ ] 호출량과 과금 unit을 서비스 내부에서 월별 집계할 기준시각을 UTC로 고정한다.

기록할 비밀이 아닌 값:

```text
GOOGLE_CLOUD_PROJECT_ID
GOOGLE_RUNTIME_SERVICE_ACCOUNT_EMAIL
GOOGLE_BILLING_PERIOD_TIMEZONE=UTC
```

### D. 지금 준비: Google 비용 안전장치

- [ ] Cloud Billing 월 예산을 `$100`으로 설정한다.
- [ ] 실제 비용 50%와 100% threshold 이메일 알림을 설정한다.
- [ ] 가능하면 Pub/Sub programmatic budget notification을 연결한다.
- [ ] 애플리케이션 counter의 `$50` Telegram warning을 billing period별 한 번만 발송한다.
- [ ] 애플리케이션 counter의 `$100` 도달 시 신규 Google moderation 호출을 중단한다.
- [ ] sample rate는 `1% → 5%`, 절대 상한은 `10%`로 제한한다.
- [ ] 비용·quota·sample config는 client request로 변경할 수 없게 server policy로 고정한다.
- [ ] 실제 비용을 발생시키지 않는 synthetic counter로 `$49.99`, `$50`, `$99.99`, `$100` 경계를
      시험할 계획을 등록한다.

주의: Cloud Billing 데이터에는 지연이 있으므로 Cloud budget alert만으로 정확한 `$100` 차단을
보장하지 않는다.

### E. 결제 없이 진행: 64-hex 운영 인증

- [ ] `randomBytes(32).toString("hex")`로 lowercase 64-hex `MODERATION_OPS_SECRET`을 생성한다.
- [ ] secret은 Vercel Production Sensitive Environment Variable과 비밀번호 관리자에만 저장한다.
- [ ] Preview에는 Production과 다른 secret을 사용한다.
- [ ] `POST /api/ops/login`에서만 secret을 받고 URL query·fragment에 넣지 않는다.
- [ ] 32-byte buffer의 constant-time 비교, body 상한과 로그인 실패 rate limit을 구현한다.
- [ ] 성공하면 secret 대신 12시간 `__Host-moderation_ops` HttpOnly signed cookie를 발급한다.
- [ ] cookie는 `Secure`, `SameSite=Strict`, `Path=/`이며 `Domain`을 설정하지 않는다.
- [ ] session에는 version, `operatorId="lee-geonha"`, issued-at, expires-at만 넣는다.
- [ ] 원문 조회와 publish/hide/delete/restore API는 session을 각각 검증한다.
- [ ] 상태 변경 POST는 session에 더해 Origin·CSRF와 확인 화면을 요구한다.
- [ ] 운영자 열람·결정·복구를 append-only audit에 남긴다.
- [ ] secret rotation 시 기존 session이 모두 무효화되는지 확인한다.

환경변수:

```text
MODERATION_OPS_SECRET=<64-hex secret>
MODERATION_OPS_SESSION_TTL_SECONDS=43200
```

Telegram 검토 버튼은 secret이 없는 `/ops/...` URL만 열고, cookie가 없으면 로그인 화면을 거쳐
원래 same-origin `/ops/` 경로로 돌아간다. `loudnclear-v2`의 query secret 방식은 복제하지 않는다.

### F. 결제 없이 진행: 64-hex evidence 암호화

- [ ] 운영 인증과 다른 64-hex `MODERATION_EVIDENCE_KEY_CURRENT`를 생성한다.
- [ ] key를 lowercase hex 64자로 제한하고 decode 결과가 정확히 32 bytes인지 시작 시 검증한다.
- [ ] `encryptEvidence`, `decryptEvidence`, `rotateEvidenceKey` interface를 정의한다.
- [ ] `AES-256-GCM`, record별 새로운 12-byte random nonce와 16-byte auth tag를 사용한다.
- [ ] `case_public_id`, `policy_version`, `created_at`, `aad_version`을 canonical AAD로 사용한다.
- [ ] ciphertext, nonce, auth tag, algorithm, AAD version, key version, 90일 `expires_at`을 저장한다.
- [ ] current key로만 새 evidence를 암호화한다.
- [ ] rotation 중에는 previous key로 읽을 수 있게 하고 모든 미만료 row를 current로 재암호화한 뒤
      previous key를 제거한다.
- [ ] local/test key와 production key를 절대 재사용하지 않는다.
- [ ] decrypt는 유효한 운영 session의 Node.js server route에서만 수행한다.
- [ ] 복호화, 변조 탐지, nonce uniqueness, rotation, key 폐기와 90일 cleanup을 통합 테스트한다.

환경변수:

```text
MODERATION_EVIDENCE_KEY_CURRENT_VERSION=v1
MODERATION_EVIDENCE_KEY_CURRENT=<64-hex secret>
MODERATION_EVIDENCE_KEY_PREVIOUS_VERSION=
MODERATION_EVIDENCE_KEY_PREVIOUS=
```

금지되는 상태:

- 운영 인증과 evidence 암호화에 같은 key 사용
- 개발·Preview key를 Production에서 재사용
- query, Telegram, 로그, DB에 평문 key 저장
- 같은 GCM nonce를 재사용
- auth tag 검증 실패 ciphertext를 표시하거나 자동 복구
- decrypt key 또는 Supabase service-role key를 브라우저에 제공

### G. 결제 유예: Hugging Face managed endpoint

- [ ] 후보 모델 repository, license, revision commit을 기록한다.
- [ ] 서비스 corpus benchmark는 우선 로컬 CPU 또는 CI의 제한된 job에서 실행한다.
- [ ] ONNX artifact, digest, model card와 SBOM을 준비한다.
- [ ] production decision engine에서는 managed endpoint가 없으면 해당 provider를 `off`로 명시한다.
- [ ] 다음 trigger 중 하나가 충족되면 x2 CPU endpoint 결제를 재검토한다.

결제 재검토 trigger:

- Google 예상 비용이 월 `$50`에 접근
- 예산 때문에 필요한 Google 표본 비율을 유지할 수 없음
- 수동 검수 oldest age가 반복적으로 6시간을 초과
- 규칙만으로 처리하기 어려운 애매한 글이 지속적으로 증가
- 로컬 benchmark가 정해진 품질·p95·메모리 gate를 통과
- 실제 트래픽 시나리오에서 managed CPU가 Google 확대보다 저렴하다는 결과가 나옴

결제를 시작할 때는 private endpoint, CPU x2부터 시작하고 x4는 메모리 또는 p95가 부족할 때만
비교한다. benchmark가 끝난 endpoint는 pause하거나 삭제한다.

### H. 개발 중 준비: 개인정보 처리방침

- [ ] 서비스 운영 주체명과 책임자 이건하를 기록한다.
- [ ] 개인정보 문의 이메일을 정한다.
- [ ] 서비스 도메인과 시행 예정일을 정한다.
- [ ] 위치정보의 사용 목적과 비저장 정책을 기록한다.
- [ ] moderation evidence·HMAC log·운영 알림의 90일 보존을 기록한다.
- [ ] Supabase, Vercel, Google, Hugging Face, Resend, Telegram의 처리 목적·전송 데이터·리전·보존을
      provider inventory로 작성한다.
- [ ] 미확정 값은 명시적 placeholder로 남긴다.
- [ ] public launch 전에 한국 개인정보보호·국외 이전 관련 법률 검토를 완료한다.

Hugging Face를 활성화하지 않은 기간에는 실제 처리업체 목록에서 아직 전송하지 않는 provider로
구분한다. 미래 후보를 현재 전송 중인 것처럼 고지하지 않는다.

### I. 구현 후 production 준비: 환경변수와 통합 점검

- [ ] development, preview, production 환경변수를 분리한다.
- [ ] 모든 server secret에 `NEXT_PUBLIC_` 접두사가 없는지 검사한다.
- [ ] Telegram 정상 발송, 중복 억제, `retry_after`, 실패 상태를 시험한다.
- [ ] 잘못된 webhook secret, chat ID, operator user ID를 모두 거절한다.
- [ ] Telegram URL을 여는 GET만으로 콘텐츠 상태가 변경되지 않는지 확인한다.
- [ ] 누락·오류·만료·변조된 운영 session의 원문·결정 API 접근이 모두 실패하는지 확인한다.
- [ ] Telegram URL과 server log에 운영 secret이 포함되지 않는지 확인한다.
- [ ] Google timeout·429·quota·`$100` stop fallback을 확인한다.
- [ ] evidence key 누락·형식 오류 시 암호화 저장이 fail closed하고 평문 fallback이 없는지 확인한다.
- [ ] 개인정보 처리방침 placeholder가 남아 있으면 public production 활성화를 막는다.
- [ ] 운영자 부재와 12시간 초과에도 격리 글이 자동 공개되지 않는지 확인한다.

관리형 인증·KMS 전환 trigger도 운영 runbook에 기록한다.

- 운영자가 두 명 이상이 되거나 역할별 권한 분리가 필요함
- 운영 secret 공유·유출 또는 반복 공격 징후가 발생함
- 90일 초과 legal hold, 키 사용 감사 또는 복호화 권한 분리가 필요함
- Vercel project의 secret 접근 인원이 확대됨

## 4. 당장 사용자가 수행할 최소 작업

다음 다섯 가지만 먼저 완료하면 Google 연동 구현을 시작할 수 있다.

1. 운영 비밀정보를 보관할 비밀번호 관리자 확정
2. moderation 전용 Google Cloud 프로젝트 생성
3. 프로젝트에 결제 연결 및 Cloud Natural Language API 활성화
4. `$100` 월 예산과 50%·100% 알림 설정
5. production runtime service account 생성

전체 moderation 구현에는 추가로 서로 다른 64-hex 운영 secret과 evidence key를 생성한다.
Telegram과 두 secret은 결제가 필요하지 않으므로 가능한 한 같이 준비한다. Hugging Face는 확장
trigger 충족 후로 미룬다.

## 5. 외부 식별자 전달 형식

구현자가 필요로 하는 값 중 다음은 secret이 아니므로 안전한 내부 채널로 전달할 수 있다.

```text
Google project ID:
Google runtime service account email:
Telegram bot username:
Telegram monitor channel ID:
Telegram operator user ID:
Hugging Face organization: deferred
```

다음 값은 전달 문서나 issue에 적지 않고 배포 환경의 secret UI에서만 설정한다.

```text
Telegram bot token
Telegram webhook secret
Google credential/private key
Supabase service-role/secret key
64-hex moderation ops secret
64-hex evidence current/previous key
Hugging Face access token
```

## 6. 참고 자료

- [Google Cloud Natural Language 설정](https://cloud.google.com/natural-language/docs/setup)
- [Google Cloud 예산과 알림](https://docs.cloud.google.com/billing/docs/how-to/budgets)
- [Google Cloud programmatic budget notifications](https://docs.cloud.google.com/billing/docs/how-to/budgets-programmatic-notifications)
- [Telegram bot 생성](https://core.telegram.org/bots/tutorial)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Node.js Crypto](https://nodejs.org/api/crypto.html)
- [Vercel Sensitive Environment Variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables)
- [Hugging Face Inference Endpoints quick start](https://huggingface.co/docs/inference-endpoints/quick_start)
- [Hugging Face Inference Endpoints 설정](https://huggingface.co/docs/inference-endpoints/guides/configuration)
