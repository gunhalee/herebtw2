# 여기 근데 - MVP 1차 개발 명세서(PRD)

## 1. 문서 목적

이 문서는 **여기 근데** 서비스의 1차 MVP를 직접 개발하기 위한 기준 문서다.  
대상 독자는 개발자이며, 기능 범위, 정책, 데이터 구조, 화면 동작, 예외 처리의 최소 기준을 정의한다.

본 문서는 **정치인 기능 이전 단계의 시민 중심 MVP**를 다룬다.

## 2. 제품 목표

여기 근데는 지역 현장에서 느낀 의견을 짧게 남기고, 주변 사용자가 읽고 공감할 수 있도록 만드는 위치 기반 지역 발언 플랫폼이다.

MVP 1차의 목표는 다음과 같다.

- 위치 기반 읽기/쓰기 경험 검증
- 짧은 텍스트 중심 포스트 소비 패턴 검증
- 행정동명과 거리 기반 리스트 UI의 유효성 검증
- 계정 없는 즉시 참여 구조 검증
- 익명 발언 구조가 실제 사용성을 가지는지 검증

## 3. MVP 범위

### 포함 범위

- 앱 첫 진입 시 위치 권한 요청
- 위치 허용 시 현재 위치 기반 주변 포스트 로드
- 위치 거부 시 읽기 전용 제한 모드 진입
- 거리순 포스트 목록 및 상세 읽기
- 위치 인증 후 포스트 작성
- 위치 허용 상태에서 `맞아요`
- 위치 허용 상태에서 포스트 신고
- 작성 직후 이미지 카드 다운로드
- 작성 후 3분 이내 삭제
- 기본 스팸 대응

### 제외 범위

- 정치인 계정
- 정치인 답글
- 정치인 인증 배지
- 이미지 업로드
- 완독 수
- 댓글
- 팔로우
- 알림
- PWA 설치 CTA
- 계정 체계
- 추천 알고리즘 고도화

## 4. 사용자 역할

| 역할 | 설명 | 가능 기능 |
| --- | --- | --- |
| 사용자 | 회원가입이나 로그인 없이 익명 디바이스 아이디 기반으로 사용하는 사용자 | 주변 포스트 읽기, 위치 인증 후 포스트 작성, `맞아요`, 신고, 작성 직후 이미지 카드 다운로드, 작성 후 3분 이내 삭제 |

## 5. 핵심 정책

### 5-1. 위치 정책

- 앱 첫 진입 시 위치 권한을 요청한다.
- 권한 허용 시 현재 위치를 기준으로 주변 포스트와 거리 정보를 로드한다.
- 권한 거부 시 제한 모드로 진입한다.
- 제한 모드에서는 포스트 읽기만 가능하다.
- 제한 모드에서는 포스트 작성, `맞아요`, 신고가 불가능하다.
- 포스트 위치 표시는 `행정동명`만 사용한다.
- 포스트에는 사용자 현재 위치 기준 거리 정보를 함께 표시한다.
- 서버에는 GPS 원본 좌표를 저장하지 않는다.
- 좌표 정보는 요청 처리 시점 검증용으로만 사용하고 DB에는 저장하지 않는다.
- 서버에는 행정동명과 행정동 식별용 코드만 저장한다.

### 5-2. 작성 정책

- 포스트는 텍스트 전용이다.
- 최대 길이는 100자다.
- 작성 후 수정은 불가능하다.
- 작성자는 작성 직후 3분 동안만 자신의 포스트를 삭제할 수 있다.
- 작성 횟수 자체에는 일일 제한을 두지 않는다.
- 익명 디바이스 아이디 기준 `30초에 1회 작성 가능` 정책을 적용한다.
- 동일 익명 디바이스 아이디의 완전 동일 문장 재작성은 차단한다.
- 포스트 작성 시점에 위치 인증이 필요하다.
- 사용자가 어떤 화면을 보고 있든, 작성 시점의 실제 현재 위치를 기준으로 포스트 귀속 위치를 자동 결정한다.

### 5-3. 익명성 정책

- 포스트는 다른 사용자에게 익명으로 노출한다.
- 사용자 닉네임, 소셜 핸들, 프로필 정보는 MVP 1차에서 사용하지 않는다.
- 모든 포스트는 사용자 식별 정보 없이 익명으로 노출한다.
- 작성 후에는 작성자 본인의 포스트도 일반 포스트와 동일하게 섞여 보이도록 한다.

### 5-4. 반응/신고 정책

- `맞아요`는 위치 권한 허용 상태에서만 가능하다.
- `맞아요`는 포스트당 익명 디바이스 아이디 기준 1회만 가능하다.
- 사용자는 `맞아요`를 취소할 수 있다.
- 사용자가 `내가 맞아요 했는지` 여부는 익명 디바이스 아이디 기준으로 저장 및 표시한다.
- 신고는 위치 권한 허용 상태에서만 가능하다.
- 신고는 포스트당 익명 디바이스 아이디 기준 1회만 가능하다.
- 신고 접수만으로 포스트를 자동 숨김 처리하지 않는다.
- 신고 내용은 관리자가 사후 검수한다.

### 5-5. 공유/다운로드 정책

- 포스트 작성 직후 이미지 카드 다운로드를 제공한다.
- 다운로드 카드는 포스트 본문, 행정동명, 서비스명만 담는 경량 카드 형식을 사용한다.
- 자동 SNS 연동은 제공하지 않는다.
- 완독 수는 MVP 1차에 포함하지 않는다.
- 댓글 기능은 제공하지 않는다.
- 좋아요 같은 별도 반응은 제공하지 않는다.

### 5-6. 스팸 대응 정책

- 동일 기기 또는 비정상 요청 흐름에 대해 초단기 연속 작성 rate limit를 적용한다.
- 기본 정책은 `30초에 1회 작성 가능`이다.
- 동일하거나 유사한 내용의 반복 업로드를 방지한다.
- MVP 1차의 중복 내용 차단은 `동일 익명 디바이스 아이디의 완전 동일 문장 반복 차단`으로 정의한다.
- 비정상 트래픽 및 비정상 행동 로그를 저장한다.
- 운영 로그는 작성/삭제/다운로드/맞아요/신고/차단 이벤트뿐 아니라 위치 권한, 주변 포스트 조회, 상세 진입 이벤트까지 포함한다.
- 운영자가 사후 차단 기준을 적용할 수 있도록 로그를 남긴다.

## 6. 핵심 사용자 플로우

### 6-1. 첫 진입

1. 사용자가 앱에 접속한다.
2. 앱은 기능 설명과 개인정보 안심 메시지를 함께 담은 위치 권한 사전 안내 모달 또는 화면을 먼저 노출한다.
3. 사전 안내 이후 시스템 위치 권한 요청을 노출한다.
4. 위치 권한 허용 시 현재 위치 기준으로 메인 주변 포스트 화면을 로드한다.
5. 위치 권한 거부 시 읽기 전용 제한 모드로 진입한다.

### 6-2. 포스트 읽기

1. 사용자는 거리순으로 정렬된 주변 포스트 목록을 본다.
2. 포스트 카드에서 행정동명과 거리 정보를 함께 확인한다.
3. 목록 아이템을 탭해 `여긴 근데` 상세를 연다.
4. 상세에서 본문, 행정동명, 거리, 상대 시간, `맞아요`, 신고 액션을 확인한다.

### 6-3. 포스트 작성

1. 사용자가 작성 버튼을 누른다.
2. 작성 화면 진입 즉시 위치 권한 및 현재 위치 유효성을 검사한다.
3. 현재 위치를 기준으로 행정동 정보를 계산한다.
4. 100자 이내 텍스트를 입력한다.
5. 작성 완료 시 포스트를 저장한다.
6. 작성 성공 후 해당 위치 기준의 메인 주변 포스트 화면으로 복귀한다.
7. 작성된 포스트는 거리순 목록에 반영한다.
8. 작성 성공 직후 성공 토스트를 노출하고, 새 포스트를 하단 목록 상단에서 하이라이트한다.
9. 사용자는 작성 직후 이미지 카드 다운로드 버튼과 삭제 버튼을 함께 본다.
10. 삭제 버튼 옆에는 남은 삭제 가능 시간 카운트다운을 노출한다.

### 6-4. 포스트 상호작용

1. 사용자는 위치 권한 허용 상태에서 포스트에 `맞아요`를 누를 수 있다.
2. `맞아요`는 익명 디바이스 아이디 기준으로 포스트당 1회만 가능하며, 재탭 시 취소된다.
3. 사용자는 위치 권한 허용 상태에서 신고 액션을 누를 수 있다.
4. 신고는 익명 디바이스 아이디 기준으로 포스트당 1회만 가능하다.

### 6-5. 이미지 카드 다운로드

1. 사용자는 작성 성공 직후 카드 다운로드 CTA를 본다.
2. CTA 선택 시 포스트 본문, 행정동명, 서비스명을 포함한 이미지 카드를 생성한다.
3. 사용자는 해당 카드를 기기에 저장한다.

### 6-6. 작성 직후 삭제

1. 사용자는 작성 성공 직후 3분 동안 삭제 버튼을 볼 수 있다.
2. 버튼 옆에는 남은 삭제 가능 시간이 카운트다운 형태로 노출된다.
3. 사용자가 삭제를 누르면 확인 후 포스트를 제거한다.

## 7. 화면별 요구사항

### 7-1. 메인 주변 포스트 화면

**목적**

- 현재 위치 기준으로 주변 포스트를 읽는 메인 진입 화면
- 행정동명과 거리 정보만으로 지역 맥락을 빠르게 이해하는 화면

**구성 요소**

- 상단 제목 및 위치 안내
- 제한 모드용 상단 고정 배너
- 거리순 포스트 목록
- 작성 버튼
- 위치 권한 상태 안내 UI

**동작**

- 위치 허용 시 현재 위치 기준으로 주변 포스트를 로드한다.
- 위치 거부 시 읽기 전용 제한 모드로 진입한다.
- 목록 기본 정렬은 거리순을 사용한다.
- 각 카드에는 행정동명, 거리, 본문, 상대 시간, 맞아요 수를 표시한다.
- 초기 10개 포스트를 로드하고, 이후 추가 로드 방식으로 더 불러온다.
- 목록에서 포스트를 탭하면 `여긴 근데` 상세 화면으로 전환한다.
- 제한 모드에서는 상단 고정 배너로 위치 권한 허용 CTA를 제공한다.
- 위치 거부 상태에서는 거리 정보 대신 행정동명 중심 읽기 경험만 제공할 수 있다.

**위치 권한 사전 안내 문구 방향**

- 기능 설명과 서비스 가치 설명을 함께 담는 혼합형 톤을 사용한다.
- 예시: `주변 지역의 목소리를 보여주고, 지금 있는 곳의 의견을 남기기 위해 위치 정보가 필요합니다. 좌표는 저장하지 않고 행정동 단위로만 사용합니다.`

### 7-2. 포스트 상세 화면 (`여긴 근데`)

**표시 항목**

- 본문
- 행정동명
- 내 위치 기준 거리
- 작성 시각(상대 시간)
- 맞아요 수
- 내가 맞아요 했는지 여부
- 신고 액션

**동작**

- 본문은 최대 100자 전부 노출한다.
- 포스트 상세는 목록 화면에서 좌측 슬라이드 전환 방식으로 노출한다.
- 상세 화면에서도 `맞아요`와 신고를 사용할 수 있다.
- 상세 화면에서 위치 표시는 행정동명과 거리 정보를 함께 노출한다.

### 7-3. 메인 포스트 목록

- 각 카드에는 본문 전부, 행정동명, 거리, 상대 시간, 맞아요 수를 표시한다.
- 본문은 최대 100자이므로 목록에서도 축약 없이 전부 노출한다.
- 초기 10개를 로드하고, 스크롤 끝 도달 시 자동으로 추가 로드한다.
- 포스트 상세는 목록 카드 탭으로만 진입 가능하다.
- 방금 작성한 포스트가 있는 경우 목록 상단에 우선 반영하고 하이라이트한다.
- 하이라이트는 사용자가 다른 구획으로 이동할 때까지 유지한다.
- 빈 상태에서는 참여 유도형 문구를 사용한다.

### 7-3. 포스트 작성 화면

**입력 요소**

- 텍스트 입력 필드
- 글자 수 표시(`현재 글자수 / 100`)
- 작성 완료 버튼

**초기 상태**

- 작성 화면 진입 시 위치 확인을 즉시 시작한다.
- 위치 확인 중에는 로딩 스피너와 `위치를 확인하는 중` 메시지를 노출한다.
- 위치 확인 완료 후 입력창 상단에 `현재 위치: OO동` 형태로 행정동명을 표시한다.
- 작성 화면에서는 세부 좌표나 추가 위치 구획 정보를 사용자에게 노출하지 않는다.

**검증**

- 0자 초과 100자 이하만 허용
- 위치 권한 허용 상태여야 함
- 현재 위치 기반 행정동 및 구획 계산 가능 상태여야 함
- 스팸 정책에 걸리지 않아야 함
- 작성 완료 버튼은 1자 이상 입력되고 위치 확인이 완료된 경우에만 활성화한다

**에러 케이스**

- 위치 권한 없음
- 위치 확인 실패
- 행정동 변환 실패
- 글자 수 초과
- rate limit 초과
- 중복/유사 내용 감지

**실패 대응 UX**

- 위치 확인 실패 시 에러 메시지와 함께 `다시 시도` 액션을 제공한다.
- 위치 권한 또는 시스템 설정 이슈가 의심되는 경우 설정 이동 유도 액션을 함께 제공한다.
- rate limit 초과 시 제한 이유를 설명형 메시지로 안내하고, 남은 제한 시간을 함께 표시한다.
- 중복/유사 내용 감지 시 같은 내용이 이미 작성되었음을 안내하고, 내용을 일부 수정해 다시 작성하도록 유도한다.
- 작성 요청 실패 시 사용자가 입력한 텍스트는 유지한다.

### 7-4. 작성 완료 및 다운로드 플로우

- 작성 성공 직후 성공 토스트와 함께 이미지 카드 다운로드 CTA를 노출한다.
- 작성 성공 직후 삭제 버튼도 함께 노출한다.
- 삭제 버튼 옆에 남은 삭제 가능 시간을 카운트다운으로 표시한다.
- CTA는 작성 완료 직후 가장 먼저 보이는 위치에 배치한다.
- 카드에는 본문, 행정동명, 서비스명 정도의 최소 정보만 담는다.
- 다운로드 실패 시 재시도 액션을 제공한다.

## 8. 데이터 모델 초안

### 8-1. device_identities

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid | 내부 식별자 |
| anonymous_device_id | text | 클라이언트가 보관하는 익명 디바이스 아이디 |
| first_seen_at | timestamptz | 최초 접근 시각 |
| last_seen_at | timestamptz | 마지막 접근 시각 |

**제약**

- `anonymous_device_id` unique
- 계정 정보나 소셜 프로필과 연결하지 않는다

### 8-2. posts

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid | 포스트 ID |
| author_device_id | uuid | 작성 디바이스 식별자 |
| content | text | 본문 |
| administrative_dong_name | text | 행정동명 |
| administrative_dong_code | text | 행정동 코드 |
| grid_cell_path | text | 지역 계층 경로 식별자 |
| status | text | `active`, `deleted` |
| created_at | timestamptz | 생성 시각 |
| deleted_at | timestamptz nullable | 삭제 시각 |
| delete_expires_at | timestamptz | 작성 후 3분 삭제 만료 시각 |

**제약**

- content 길이 1~100자
- 작성 후 수정 불가
- 삭제는 `delete_expires_at` 이전에만 허용

### 8-3. post_reactions

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid | 반응 ID |
| post_id | uuid | 포스트 ID |
| device_id | uuid | 반응 디바이스 식별자 |
| reaction_type | text | MVP는 `agree` 고정 |
| created_at | timestamptz | 생성 시각 |

**제약**

- `(post_id, device_id, reaction_type)` unique

### 8-4. post_reports

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid | 신고 ID |
| post_id | uuid | 신고 대상 포스트 ID |
| reporter_device_id | uuid | 신고 디바이스 식별자 |
| reason_code | text | 신고 사유 코드 |
| created_at | timestamptz | 생성 시각 |

**제약**

- `(post_id, reporter_device_id)` unique

### 8-5. abuse_logs

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| id | uuid | 로그 ID |
| device_id | uuid nullable | 익명 디바이스 식별자 |
| event_type | text | rate_limit, duplicate_content, suspicious_activity 등 |
| payload | jsonb | 세부 로그 |
| created_at | timestamptz | 생성 시각 |

### 8-6. PostgreSQL/Supabase 스키마 구체화

**공통 원칙**

- 모든 PK는 `uuid`를 사용한다.
- 기본 생성 함수는 `gen_random_uuid()`를 사용한다.
- 시간 컬럼은 모두 `timestamptz` 기준으로 저장한다.
- 위치 원본 좌표는 어떤 테이블에도 저장하지 않는다.
- 익명 디바이스 아이디는 운영/기능 제어용으로만 사용한다.
- 삭제는 운영 추적을 위해 `soft delete`를 기본으로 한다.

**권장 확장/전제**

- `pgcrypto` 활성화
- 클라이언트는 최초 진입 시 익명 디바이스 아이디를 생성해 로컬에 저장한다
- 서버는 쓰기/제어 API에서 익명 디바이스 아이디를 검증한다

1. `public.device_identities`

```sql
create table public.device_identities (
  id uuid primary key default gen_random_uuid(),
  anonymous_device_id text not null unique,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
```

2. `public.posts`

```sql
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_device_id uuid not null references public.device_identities(id),
  content varchar(100) not null,
  administrative_dong_name text not null,
  administrative_dong_code text not null,
  grid_cell_path text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  delete_expires_at timestamptz not null default (now() + interval '3 minutes'),
  constraint posts_content_length_check check (char_length(content) between 1 and 100),
  constraint posts_status_check check (status in ('active', 'deleted'))
);
```

3. `public.post_reactions`

```sql
create table public.post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  device_id uuid not null references public.device_identities(id) on delete cascade,
  reaction_type text not null default 'agree',
  created_at timestamptz not null default now(),
  constraint post_reactions_type_check check (reaction_type in ('agree')),
  constraint post_reactions_unique unique (post_id, device_id, reaction_type)
);
```

4. `public.post_reports`

```sql
create table public.post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  reporter_device_id uuid not null references public.device_identities(id) on delete cascade,
  reason_code text not null,
  created_at timestamptz not null default now(),
  constraint post_reports_reason_code_check check (
    reason_code in ('hate_or_abuse', 'misinformation', 'spam_or_ad', 'other_policy')
  ),
  constraint post_reports_unique unique (post_id, reporter_device_id)
);
```

5. `public.abuse_logs`

```sql
create table public.abuse_logs (
  id uuid primary key default gen_random_uuid(),
  device_id uuid references public.device_identities(id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

**권장 인덱스**

```sql
create index idx_posts_active_created_at
  on public.posts (created_at desc)
  where status = 'active';

create index idx_posts_active_grid_cell_path
  on public.posts (grid_cell_path, created_at desc)
  where status = 'active';

create index idx_posts_active_dong_code
  on public.posts (administrative_dong_code, created_at desc)
  where status = 'active';

create index idx_post_reactions_post_id
  on public.post_reactions (post_id);

create index idx_post_reports_post_id
  on public.post_reports (post_id);
```

**중복/제한 정책의 DB 반영 방식**

- `30초 1회 작성 제한`은 DB constraint보다 애플리케이션 로직으로 처리한다.
- 동일 익명 디바이스 아이디의 완전 동일 문장 차단은 부분 unique index로 보조할 수 있다.

```sql
create unique index uq_posts_device_active_content
  on public.posts (author_device_id, content)
  where status = 'active';
```

## 9. 서버 기능 요구사항

### 9-1. 익명 디바이스 식별

- 최초 접근 시 클라이언트는 익명 디바이스 아이디를 생성한다.
- 서버는 쓰기 API 진입 시 익명 디바이스 아이디를 `device_identities`와 매핑한다.
- 계정 생성이나 소셜 로그인 플로우는 없다.

### 9-2. 포스트 조회

- 현재 화면 뷰포트 기준 포스트 조회 API가 필요하다.
- 삭제된 포스트는 기본 조회에서 제외한다.
- 목록 정렬 기본값은 `맞아요 많은 순`, 동률 시 `최신순`이다.
- 응답에는 `myAgree`를 포함해 기기 기준 상태를 함께 전달한다.

### 9-3. 포스트 생성

- 위치 권한 허용 상태에서만 가능하다.
- 좌표는 요청 처리에만 사용하고 저장하지 않는다.
- 서버가 행정동/구획을 재계산하고, 클라이언트 값과 다르면 서버 결과를 우선한다.
- `30초 1회` rate limit와 완전 동일 문장 차단을 적용한다.
- 성공 시 삭제 만료 시각과 카드 다운로드용 최소 메타데이터를 함께 반환할 수 있다.

### 9-4. 포스트 삭제

- 작성 후 3분 이내에만 허용한다.
- 삭제 권한은 작성 디바이스 기준으로 검증한다.
- 삭제 후에는 기본 조회에서 제외한다.

### 9-5. 포스트 신고

- 위치 권한 허용 상태에서만 가능하다.
- 동일 익명 디바이스 아이디의 동일 포스트 중복 신고는 막는다.
- 신고 접수만으로 자동 비노출 처리하지 않는다.
- 신고 내용은 관리자 검수 대상이다.

### 9-6. 맞아요 토글

- 위치 권한 허용 상태에서만 가능하다.
- 동일 익명 디바이스 아이디 기준 포스트당 1회만 가능하다.
- 재탭 시 취소된다.

### 9-7. RPC/API 명세

**응답 공통 형식**

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

실패 시 예시:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "RATE_LIMITED",
    "message": "너무 짧은 시간에 여러 글이 작성되어 18초 후 다시 시도할 수 있습니다."
  }
}
```

**에러 코드 표준**

- `VALIDATION_ERROR`
- `LOCATION_REQUIRED`
- `LOCATION_RESOLVE_FAILED`
- `RATE_LIMITED`
- `DUPLICATE_CONTENT`
- `POST_NOT_FOUND`
- `DELETE_WINDOW_EXPIRED`
- `ALREADY_REPORTED`
- `LOCATION_PERMISSION_REQUIRED`
- `INTERNAL_ERROR`

#### A. 디바이스 등록/동기화

1. `POST /api/device/register`

목적:

- 익명 디바이스 아이디를 서버의 `device_identities`와 동기화

요청:

```json
{
  "anonymousDeviceId": "anon_device_abc123"
}
```

응답:

```json
{
  "success": true,
  "data": {
    "device": {
      "id": "uuid",
      "anonymousDeviceId": "anon_device_abc123"
    }
  },
  "error": null
}
```

샘플 구현 메모:

- 클라이언트는 최초 진입 시 생성한 `anonymousDeviceId`를 로컬 스토리지나 앱 저장소에 유지한다.
- 서버 응답의 내부 `device.id`는 DB 참조용이며, 클라이언트가 이후 요청에서 다시 보낼 값은 `anonymousDeviceId`다.

#### B. 주변 포스트 읽기

1. `POST /api/posts/list`

목적:

- 현재 위치 기준 거리순 주변 포스트 목록 조회

요청:

```json
{
  "anonymousDeviceId": "anon_device_abc123",
  "location": {
    "latitude": 37.4979,
    "longitude": 127.0276
  },
  "pagination": {
    "limit": 10,
    "cursor": null
  }
}
```

응답:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "content": "퇴근길 횡단보도 신호가 너무 짧아요",
        "administrativeDongName": "역삼1동",
        "distanceMeters": 280,
        "relativeTime": "3분 전",
        "agreeCount": 2,
        "myAgree": false,
        "isHighlighted": true
      }
    ],
    "nextCursor": "opaque_cursor"
  },
  "error": null
}
```

추가 필드 예시:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "8dfc5e48-5322-4f58-bf74-e8bc2fc3fb3b",
        "content": "퇴근길 횡단보도 신호가 너무 짧아요",
        "administrativeDongName": "역삼1동",
        "distanceMeters": 280,
        "relativeTime": "3분 전",
        "agreeCount": 2,
        "myAgree": false,
        "canReport": true,
        "isDeleted": false,
        "isHighlighted": false
      }
    ],
    "nextCursor": "eyJjcmVhdGVkQXQiOiIyMDI2LTA0LTA1VDA2OjQxOjI4LjAwMFoiLCJpZCI6IjhkZmM1ZTQ4LTUzMjItNGY1OC1iZjc0LWU4YmMyZmMzZmIzYiJ9"
  },
  "error": null
}
```

정렬 규칙:

- 기본값은 `distance`
- 거리가 같으면 `latest`

2. `GET /api/posts/:postId?anonymousDeviceId=...`

목적:

- 포스트 상세 조회

응답:

```json
{
  "success": true,
  "data": {
    "post": {
      "id": "uuid",
      "content": "퇴근길 횡단보도 신호가 너무 짧아요",
      "administrativeDongName": "역삼1동",
      "distanceMeters": 280,
      "relativeTime": "3분 전",
      "agreeCount": 2,
      "myAgree": false,
      "canReport": true
    }
  },
  "error": null
}
```

샘플 상세 응답 확장:

```json
{
  "success": true,
  "data": {
    "post": {
      "id": "8dfc5e48-5322-4f58-bf74-e8bc2fc3fb3b",
      "content": "퇴근길 횡단보도 신호가 너무 짧아요",
      "administrativeDongName": "역삼1동",
      "distanceMeters": 280,
      "relativeTime": "3분 전",
      "agreeCount": 2,
      "myAgree": true,
      "canReport": true,
      "canDelete": false,
      "deleteRemainingSeconds": 0
    }
  },
  "error": null
}
```

#### C. 포스트 생성

1. `POST /api/posts`

목적:

- 위치 검증 후 포스트 생성

요청:

```json
{
  "anonymousDeviceId": "anon_device_abc123",
  "content": "퇴근길 횡단보도 신호가 너무 짧아요",
  "location": {
    "latitude": 37.4979,
    "longitude": 127.0276
  },
  "clientResolved": {
    "administrativeDongName": "역삼1동",
    "administrativeDongCode": "11680640",
    "gridCellPath": "nation.seoul.gangnam.yeoksam1"
  }
}
```

응답:

```json
{
  "success": true,
  "data": {
    "post": {
      "id": "uuid",
      "content": "퇴근길 횡단보도 신호가 너무 짧아요",
      "administrativeDongName": "역삼1동",
      "createdAt": "2026-04-05T06:41:28.000Z",
      "deleteExpiresAt": "2026-04-05T06:44:28.000Z"
    }
  },
  "error": null
}
```

작성 직후 후속 액션용 응답 예시:

```json
{
  "success": true,
  "data": {
    "post": {
      "id": "8dfc5e48-5322-4f58-bf74-e8bc2fc3fb3b",
      "content": "퇴근길 횡단보도 신호가 너무 짧아요",
      "administrativeDongName": "역삼1동",
      "createdAt": "2026-04-05T06:41:28.000Z",
      "deleteExpiresAt": "2026-04-05T06:44:28.000Z"
    },
    "postWriteState": {
      "canDelete": true,
      "deleteRemainingSeconds": 180
    },
    "imageCard": {
      "downloadUrl": "/api/posts/8dfc5e48-5322-4f58-bf74-e8bc2fc3fb3b/card",
      "title": "여기 근데",
      "administrativeDongName": "역삼1동"
    }
  },
  "error": null
}
```

실패 응답 예시:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "DUPLICATE_CONTENT",
    "message": "같은 내용의 글이 이미 등록되어 있습니다. 내용을 조금 수정해 다시 시도해주세요."
  }
}
```

#### D. 포스트 삭제

1. `POST /api/posts/:postId/delete`

목적:

- 작성 후 3분 이내 soft delete

요청:

```json
{
  "anonymousDeviceId": "anon_device_abc123"
}
```

응답:

```json
{
  "success": true,
  "data": {
    "postId": "uuid",
    "deleted": true
  },
  "error": null
}
```

삭제 가능 시간 초과 예시:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "DELETE_WINDOW_EXPIRED",
    "message": "작성 후 3분이 지나 삭제할 수 없습니다."
  }
}
```

#### E. 맞아요 토글

1. `POST /api/posts/:postId/agree/toggle`

요청:

```json
{
  "anonymousDeviceId": "anon_device_abc123"
}
```

응답:

```json
{
  "success": true,
  "data": {
    "postId": "uuid",
    "agreed": true,
    "agreeCount": 3
  },
  "error": null
}
```

취소 시 응답 예시:

```json
{
  "success": true,
  "data": {
    "postId": "uuid",
    "agreed": false,
    "agreeCount": 2
  },
  "error": null
}
```

#### F. 포스트 신고

1. `POST /api/posts/:postId/report`

요청:

```json
{
  "anonymousDeviceId": "anon_device_abc123",
  "reasonCode": "spam_or_ad"
}
```

응답:

```json
{
  "success": true,
  "data": {
    "postId": "uuid",
    "reported": true
  },
  "error": null
}
```

중복 신고 예시:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ALREADY_REPORTED",
    "message": "이미 신고한 포스트입니다."
  }
}
```

**구현 원칙**

- 목록 API는 cursor pagination을 기본으로 한다.
- 쓰기 API는 서버 응답 기준으로 최종 상태를 동기화한다.
- 공개 읽기 API는 `status='active'` 포스트만 반환한다.
- 관리자/운영 API는 MVP 문서 범위에서 제외한다.

### 9-8. Next.js 권장 폴더 구조

```text
src/
  app/
    (public)/
      page.tsx
      layout.tsx
    write/
      page.tsx
    api/
      device/
        register/
          route.ts
      posts/
        route.ts
        list/
          route.ts
        [postId]/
          route.ts
          delete/
            route.ts
          agree/
            toggle/
              route.ts
          report/
            route.ts
  components/
    home/
      home-screen.tsx
      dong-posts-screen.tsx
    sheet/
      post-list-item.tsx
    post/
      post-compose-form.tsx
      post-report-dialog.tsx
      agree-button.tsx
      delete-post-button.tsx
      download-card-button.tsx
    common/
      toast.tsx
      loading-state.tsx
      empty-state.tsx
  lib/
    device/
      get-anonymous-device-id.ts
      sync-device.ts
    geo/
      reverse-geocode.ts
    posts/
      queries.ts
      mutations.ts
      serializers.ts
      validators.ts
    abuse/
      rate-limit.ts
      duplicate-check.ts
      log-event.ts
    utils/
      datetime.ts
      cursor.ts
      errors.ts
  actions/
    posts/
      create-post.ts
      delete-post.ts
      toggle-agree.ts
      report-post.ts
  types/
    api.ts
    post.ts
    device.ts
```

### 9-9. 화면-API 매핑

| 화면/기능 | 호출 대상 | 비고 |
| --- | --- | --- |
| 메인 주변 포스트 목록 | `POST /api/posts/list` | 초기 10개 + cursor 추가 로드 |
| 포스트 상세 (`여긴 근데`) | `GET /api/posts/:postId` | 상세에서 신고/맞아요 가능 |
| 작성 화면 진입 | `lib/geo/reverse-geocode.ts` | 클라이언트 1차 위치 확인 |
| 디바이스 등록 | `POST /api/device/register` | 익명 디바이스 아이디 동기화 |
| 포스트 작성 | `POST /api/posts` | 서버 검증 필수 |
| 맞아요 토글 | `POST /api/posts/:postId/agree/toggle` | 낙관적 UI 가능 |
| 포스트 신고 | `POST /api/posts/:postId/report` | 사유 코드형 |
| 포스트 삭제 | `POST /api/posts/:postId/delete` | 3분 내 삭제 |

### 9-10. 구현 순서 권장안

#### 1단계. 기반 세팅

- Next.js App Router 기본 구조 세팅
- 익명 디바이스 아이디 생성/동기화 유틸 구성
- 공통 에러 포맷/응답 포맷 정의
- DB migration 초안 작성 및 개발 DB 반영

#### 2단계. 지역/위치 기반 유틸

- 브라우저 위치 권한 요청 플로우 구현
- 사전 권한 안내 UI 구현
- 제한 모드 분기 구현
- 클라이언트 역지오코딩 유틸 구현
- 현재 위치 -> 행정동 변환 유틸 구현

#### 3단계. 읽기 경험 구현

- 메인 주변 포스트 화면 UI 구현
- `POST /api/posts/list` 구현
- 거리순 리스트 카드 구현
- `여긴 근데` 상세 슬라이드 전환 구현

#### 4단계. 포스트 작성/삭제/카드

- 작성 화면 UI 구현
- `POST /api/posts` 구현
- 동일 문장 차단, rate limit, 서버 재계산 검증 구현
- 작성 성공 토스트/하이라이트 반영 구현
- 카드 다운로드 구현
- 3분 삭제 + 카운트다운 구현

#### 5단계. 맞아요/신고

- 맞아요 토글 API 및 버튼 구현
- 신고 다이얼로그 및 신고 API 구현
- 익명 디바이스 아이디 기준 중복 제어 구현

#### 6단계. 운영/안정화

- abuse log 기록 지점 연결
- 주요 이벤트 분석 로그 연결
- 빈 상태/로딩 상태/권한 거부 상태 UX 정리
- 비정상 접근 테스트

### 9-11. 구현 우선순위 체크리스트

**필수 선행**

- DB migration
- 익명 디바이스 아이디 생성/동기화
- 위치/행정동 계산 유틸

**MVP 핵심**

- 포스트 목록 조회
- 포스트 생성
- 맞아요 토글
- 포스트 삭제
- 신고
- 카드 다운로드

**후반 안정화**

- abuse log
- cursor pagination 최적화
- 로딩/빈 상태 polish
- 권한 거부 상태 UX polish

### 9-12. 프론트 상태 모델

#### A. app shell 상태

```ts
type AppShellState = {
  anonymousDeviceId: string | null;
  deviceReady: boolean;
  permissionMode: "unknown" | "granted" | "denied";
  readOnlyMode: boolean;
};
```

상태 원칙:

- `permissionMode="denied"`이면 `readOnlyMode=true`로 강제한다.
- 읽기 전용 모드에서는 작성, `맞아요`, 신고 액션 버튼을 비활성화한다.
- 홈 화면은 별도 구획 탐색 상태 없이 주변 포스트 리스트를 바로 보여준다.

#### B. 포스트 목록 상태

```ts
type PostListItem = {
  id: string;
  content: string;
  administrativeDongName: string;
  distanceMeters: number;
  relativeTime: string;
  agreeCount: number;
  myAgree: boolean;
  canReport: boolean;
  isHighlighted: boolean;
};

type PostListState = {
  items: PostListItem[];
  nextCursor: string | null;
  loading: boolean;
  loadingMore: boolean;
  empty: boolean;
  errorMessage: string | null;
  sort: "distance";
};
```

상태 원칙:

- 기본 정렬은 항상 `distance`이며 MVP 1차에서는 사용자 정렬 변경 UI를 두지 않는다.
- 목록 초기 로드는 10개이며, 추가 조회는 `nextCursor` 존재 시에만 허용한다.
- 작성 직후 생성한 포스트가 현재 목록 범위에 포함되면 `isHighlighted=true`로 한 번 강조 노출한다.

#### C. 포스트 상세 상태

```ts
type PostDetailState = {
  postId: string | null;
  open: boolean;
  loading: boolean;
  content: string;
  administrativeDongName: string;
  distanceMeters: number;
  relativeTime: string;
  agreeCount: number;
  myAgree: boolean;
  canReport: boolean;
  canDelete: boolean;
  deleteRemainingSeconds: number;
  errorMessage: string | null;
};
```

상태 원칙:

- 상세는 메인 리스트 안에서 좌측 슬라이드 전환 상태로 관리한다.
- `deleteRemainingSeconds > 0`일 때만 삭제 버튼과 카운트다운을 함께 노출한다.
- 카운트다운이 0이 되면 `canDelete=false`로 전환하고 삭제 CTA를 숨긴다.

#### D. 포스트 작성 상태

```ts
type PostComposeState = {
  content: string;
  charCount: number;
  submitting: boolean;
  locationResolved: boolean;
  resolvedDongName: string | null;
  resolvedDongCode: string | null;
  cooldownRemainingSeconds: number;
  duplicateBlocked: boolean;
  errorMessage: string | null;
};
```

상태 원칙:

- `charCount`는 1 이상 100 이하일 때만 작성 버튼 활성화 가능 조건 중 하나가 된다.
- `locationResolved=false`이면 작성 버튼을 비활성화한다.
- `cooldownRemainingSeconds > 0`이면 작성 버튼을 비활성화하고 남은 시간을 설명형 문구로 보여준다.
- `duplicateBlocked=true`이면 입력 내용은 유지한 채 수정 유도 메시지를 보여준다.

#### E. 신고 다이얼로그 상태

```ts
type ReportDialogState = {
  open: boolean;
  postId: string | null;
  reasonCode: "hate_or_abuse" | "misinformation" | "spam_or_ad" | "other_policy" | null;
  submitting: boolean;
  submitted: boolean;
  errorMessage: string | null;
};
```

상태 원칙:

- 신고는 포스트당 1회만 가능하므로 `submitted=true` 이후 같은 포스트의 신고 CTA를 비활성화한다.
- 신고 접수 완료 후 즉시 숨김 처리하지 않고 확인 토스트만 노출한다.

### 9-13. 화면별 와이어 텍스트

#### A. 위치 권한 사전 안내

- 제목: `지금 있는 지역의 목소리를 보여드릴게요`
- 본문: `주변 지역의 목소리를 읽고 지금 있는 곳의 의견을 남기기 위해 위치 정보가 필요합니다. 좌표는 저장하지 않고 행정동 단위로만 사용합니다.`
- 기본 CTA: `위치 권한 허용`
- 보조 CTA: `나중에 할게요`

#### B. 제한 모드 진입

- 안내 문구: `위치 권한 없이도 주변 한마디는 읽을 수 있어요`
- 보조 문구: `글 작성, 맞아요, 신고는 위치 권한 허용 후 이용할 수 있습니다.`
- CTA: `위치 권한 다시 허용`

#### C. 메인 리스트 빈 상태

- 제목: `아직 이 지역의 목소리가 없어요`
- 본문: `첫 번째 목소리를 남겨보세요. 지금 있는 곳의 이야기가 이 구역의 시작이 될 수 있습니다.`
- CTA: `글 남기기`

#### D. 작성 화면

- 헤더: `여기 근데 남기기`
- 위치 표시: `{행정동명}에서 작성 중`
- 입력 플레이스홀더: `지금 이 지역에서 느낀 문제나 의견을 100자 안으로 남겨보세요`
- 글자 수: `{현재글자수}/100`
- 작성 버튼: `등록하기`
- 쿨다운 문구: `{n}초 후 다시 작성할 수 있어요`
- 중복 차단 문구: `같은 내용의 글이 이미 등록되어 있습니다. 내용을 조금 수정해 다시 시도해주세요.`

#### E. 작성 성공 직후

- 토스트: `이야기가 등록되었어요`
- 보조 문구: `작성한 글은 3분 동안만 삭제할 수 있습니다.`
- CTA 1: `이미지 카드 다운로드`
- CTA 2: `삭제`
- 카운트다운: `삭제 가능 {mm}:{ss}`

#### F. 포스트 카드/상세

- 위치: `{행정동명}`
- 시간: `{상대시간}`
- 맞아요 버튼 기본: `맞아요`
- 맞아요 버튼 활성: `맞아요 취소`
- 신고 버튼: `신고`

#### G. 신고 다이얼로그

- 제목: `이 포스트를 신고할까요?`
- 사유 항목: `혐오·비방`, `허위정보`, `광고·도배`, `기타 운영정책 위반`
- 완료 CTA: `신고하기`
- 취소 CTA: `닫기`
- 완료 토스트: `신고가 접수되었어요. 운영자가 확인할 예정입니다.`

#### H. 공통 에러/예외 문구

- 위치 확인 실패: `위치를 확인하지 못했어요. 다시 시도해주세요.`
- 행정동 변환 실패: `지역 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.`
- rate limit: `너무 짧은 시간에 여러 글이 작성되어 {n}초 후 다시 시도할 수 있습니다.`
- 삭제 만료: `작성 후 3분이 지나 삭제할 수 없습니다.`
- 중복 신고: `이미 신고한 포스트입니다.`
- 공통 서버 오류: `문제가 발생했어요. 잠시 후 다시 시도해주세요.`

### 9-14. 페이지별 컴포넌트 트리

#### A. 메인 주변 포스트 페이지

```text
app/(public)/page.tsx
  PageShell
    LocationPermissionGate
      NearbyPostsHeader
      NearbyPostsIntroCard
      PostListStateBoundary
        PostEmptyState | PostLoadingState | PostList
          PostListItem[]
      PostDetailView
        PostDetailHeader
        PostContentBlock
        AgreeButton
        ReportButton
        DeletePostButton
```

구성 원칙:

- `LocationPermissionGate`가 읽기 전용 모드와 일반 모드를 분기한다.
- 메인 화면은 별도 지도/그리드 없이 주변 포스트 리스트를 바로 노출한다.
- `PostDetailView`는 별도 라우트가 아니라 리스트 내부 슬라이드 전환 상태로 렌더링한다.

#### B. 작성 페이지

```text
app/write/page.tsx
  WritePageShell
    WriteHeader
    LocationStatusBanner
    PostComposeForm
      ComposeTextarea
      CharacterCount
      CooldownNotice
      DuplicateWarning
      SubmitButton
    WriteSuccessActions
      DownloadCardButton
      DeletePostButton
      DeleteCountdown
```

구성 원칙:

- 작성 성공 전에는 `PostComposeForm` 중심으로 렌더링한다.
- 작성 성공 후에는 같은 화면 또는 오버레이에서 `WriteSuccessActions`를 우선 노출한다.
- 삭제 CTA와 다운로드 CTA는 같은 우선순위 그룹으로 묶는다.

#### C. 공통 상호작용 컴포넌트

```text
components/post/
  AgreeButton
  ReportButton
  ReportDialog
  DeletePostButton
  DownloadCardButton

components/common/
  Toast
  ConfirmDialog
  EmptyState
  LoadingState
  ErrorState
```

구성 원칙:

- `AgreeButton`은 `myAgree`, `agreeCount`, `disabled`만 받아도 동작할 수 있게 단순 props 구조를 유지한다.
- `ReportDialog`는 `reasonCode` 선택과 제출 상태만 관리하고, 실제 제출은 상위 액션으로 위임한다.
- `DeletePostButton`은 `canDelete`와 `deleteRemainingSeconds`를 함께 받아 CTA와 카운트다운을 동기화한다.

## 10. Supabase RLS 초안

MVP 1차는 클라이언트가 직접 Supabase 테이블에 접근하는 구조보다, Next.js API/Server Action이 서버 권한으로 접근하는 구조를 기본으로 권장한다.  
따라서 RLS는 `직접 공개 쓰기 차단`과 `공개 읽기 최소 허용`을 중심으로 잡는 편이 안전하다.

### 10-1. 기본 원칙

- 모든 테이블은 RLS를 활성화한다.
- 공개 클라이언트가 테이블에 직접 `insert/update/delete` 하지 못하도록 기본 차단한다.
- 공개 읽기가 필요한 `posts`와 집계 조회는 `active` 상태에 한해 제한적으로 허용한다.
- `device_identities`, `post_reports`, `abuse_logs`는 직접 공개 조회를 허용하지 않는다.
- 실제 생성/삭제/신고/맞아요 처리는 서버 API에서 service role 또는 안전한 서버 세션으로 수행한다.

### 10-2. 테이블별 권장 정책

#### A. `public.posts`

```sql
alter table public.posts enable row level security;

create policy posts_select_active_only
on public.posts
for select
to anon, authenticated
using (status = 'active');
```

권장 메모:

- 공개 읽기는 허용하되 `deleted` 포스트는 노출하지 않는다.
- 직접 `insert/update/delete` 정책은 만들지 않는다.

#### B. `public.post_reactions`

```sql
alter table public.post_reactions enable row level security;
```

권장 메모:

- 직접 공개 조회/쓰기 모두 막는다.
- 집계는 서버 API 또는 view/RPC를 통해 노출한다.

#### C. `public.post_reports`

```sql
alter table public.post_reports enable row level security;
```

권장 메모:

- 신고 정보는 운영 데이터이므로 공개 읽기를 허용하지 않는다.
- 직접 공개 쓰기도 허용하지 않고 서버 API에서만 생성한다.

#### D. `public.device_identities`

```sql
alter table public.device_identities enable row level security;
```

권장 메모:

- 익명 디바이스 아이디 매핑 테이블은 공개 조회/수정 모두 차단한다.
- 등록/동기화는 서버 API에서 처리한다.

#### E. `public.abuse_logs`

```sql
alter table public.abuse_logs enable row level security;
```

권장 메모:

- 운영 로그 성격이므로 공개 접근을 모두 차단한다.

### 10-3. 집계용 view/RPC 처리 원칙

- `post_engagement_view`는 공개 직접 조회보다 서버 API 내부 사용을 우선한다.
- 공개 응답이 필요하면 `posts/list`나 `posts/:id` 응답에서 `agreeCount`를 조합해 반환한다.
- 거리순 정렬과 거리 계산은 서버 API 응답에서 조합해 반환하는 방식을 권장한다.

### 10-4. 서버 액션/라우트와 RLS의 관계

- `POST /api/device/register`는 `device_identities` upsert를 수행한다.
- `POST /api/posts`는 `posts` insert 전 위치/중복/rate limit 검증을 수행한다.
- `POST /api/posts/:postId/delete`는 `soft_delete_post(...)` 함수를 호출한다.
- `POST /api/posts/:postId/agree/toggle`는 `post_reactions` insert/delete를 수행한다.
- `POST /api/posts/:postId/report`는 `post_reports` insert를 수행한다.

운영 원칙:

- 클라이언트에는 service role key를 절대 노출하지 않는다.
- 서버에서만 쓰기 권한을 보유하고, 클라이언트는 API 경유 구조를 유지한다.
- 추후 실시간 기능이 필요해져도 MVP 1차에서는 직접 테이블 구독 범위를 최소화한다.

## 11. 권한 요구사항

| 기능 | 사용자 |
| --- | --- |
| 주변 포스트 읽기 | 가능 |
| 포스트 읽기 | 가능 |
| 포스트 작성 | 위치 권한 허용 시 가능 |
| 맞아요 | 위치 권한 허용 시 가능 |
| 신고 | 위치 권한 허용 시 가능 |
| 작성 직후 이미지 카드 다운로드 | 가능 |
| 작성 후 3분 이내 삭제 | 작성 디바이스에 한해 가능 |

추가로, 위치 권한 거부 상태에서는 읽기만 허용한다.

## 12. 분석 이벤트

| 이벤트명 | 설명 |
| --- | --- |
| app_opened | 앱 진입 |
| location_permission_requested | 위치 권한 요청 |
| location_permission_granted | 위치 권한 허용 |
| location_permission_denied | 위치 권한 거부 |
| nearby_post_list_loaded | 주변 포스트 목록 로드 |
| post_detail_viewed | 포스트 상세 조회 |
| post_create_clicked | 작성 시작 |
| post_created | 작성 성공 |
| post_deleted | 작성 직후 삭제 |
| agree_clicked | 맞아요 클릭 |
| agree_removed | 맞아요 취소 |
| post_report_submitted | 신고 접수 |
| post_card_downloaded | 작성 직후 이미지 카드 다운로드 |
| spam_blocked | 스팸 정책으로 차단됨 |

## 13. 비기능 요구사항

- 모바일 웹 우선으로 설계한다.
- PWA 설치 가능 구조를 고려한다.
- 거리순 리스트 렌더링 성능과 초기 화면 응답 속도를 중요 지표로 관리한다.
- 위치 정보는 최소 저장 원칙을 따른다.
- 에러 메시지는 사용자 행동 복귀가 가능하도록 명확하게 제공한다.

## 14. 위치 노출 원칙

- MVP 1차는 지도나 계층형 지역 탐색 UI를 도입하지 않는다.
- 메인 화면은 현재 위치 기준 거리순 포스트 리스트를 바로 노출한다.
- 포스트의 사용자 노출 위치명은 `행정동명`만 사용한다.
- 포스트 카드에는 `행정동명 + 거리 + 본문 + 상대 시간`을 기본 정보로 노출한다.
- 세부 좌표, 핀 위치, 하위셀 정보는 사용자에게 노출하지 않는다.

## 15. 오픈 이슈

- 포스트 조회 반경을 초기 2km 고정으로 둘 것인가, 지역 밀도에 따라 가변 반경으로 둘 것인가
