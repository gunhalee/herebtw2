# 후보자 운영 가이드

선거구 데이터 관리와 후보 등록 절차를 정리한 운영 문서다.

---

## 1. 선거구 데이터 관리

### 배경

피드의 지역구 후보 답변 우선 정렬 기능은
`src/lib/geo/data/local-election-9-dong-districts.json` 파일을 사용해
시청자의 행정동 코드 → 선거구명을 변환한다.

이 파일은 **중앙선거관리위원회 선거인수 API**에서 생성하며,
선거구 획정 결과가 공고된 뒤 재생성해야 정확한 매칭이 가능하다.

현재 파일 상태: **미생성** (모든 `localCouncilDistrict`, `metroCouncilDistrict` 값이 `null`)

### 재생성 시점

아래 두 조건이 모두 충족되면 재생성한다.

1. 중앙선거관리위원회가 제9회 전국동시지방선거(2026-06-03) 선거구 획정을 공고
2. 공공데이터포털 선거인수 API에 해당 `sgId`로 데이터가 반영

> API 반영 전에 실행하면 빈 파일이 생성된다.  
> `getCommonSgCodeList` API로 실제 `sgId`를 먼저 확인할 것.

### 재생성 절차

```bash
# 1. .env.local에 DATA_GO_KR_SERVICE_KEY 설정 확인
cat .env.local

# 2. 스크립트 실행 (sgId는 선거일 YYYYMMDD, 또는 API로 확인한 실제 ID)
node scripts/generate-local-election-9-dong-mapping.js 20260603

# 3. 생성 결과 확인 (indexEntryCount, byAdministrativeDongCodeCount가 0이면 API 미반영)
# 스크립트가 완료 후 JSON 통계를 출력함

# 4. 정상 생성됐으면 커밋
git add src/lib/geo/data/local-election-9-dong-districts.json
git commit -m "chore: regenerate election district data for 2026"
git push
```

재생성 후에는 **Vercel 재배포**가 필요하다 (JSON 파일이 서버 번들에 포함됨).

### 생성된 선거구명 형식

| 구분 | 필드 | 형식 | 예시 |
|------|------|------|------|
| 구·시·군의회 | `localCouncilDistrict` | `"{시군구명} {선거구명}"` | `"중구 나선거구"` |
| 시·도의회 | `metroCouncilDistrict` | 선관위 API 원문 | `"중·성동 제1선거구"` |

`localCouncilDistrict`에 시군구명을 앞에 붙이는 이유:  
"나선거구"는 전국 모든 시군구에서 동일하게 사용되는 문자 지정이라 중복되기 때문.

---

## 2. 후보 등록 절차

### 2-1. 사전 준비

candidates 테이블에 다음 정보를 정확히 입력해야 피드 정렬이 활성화된다.

| 컬럼 | 필수 | 설명 |
|------|------|------|
| `name` | ✅ | 후보자 실명 |
| `council_type` | ✅ | 의회 구분 (아래 허용값 참고) |
| `local_council_district` | 구시군의원만 | 구·시·군의회 선거구명 |
| `metro_council_district` | 시도의원만 | 시·도의회 선거구명 |
| `photo_url` | 권장 | 프로필 사진 URL |

**`council_type` 허용값**

```
'시도의회'   — 시·도의원
'구의회'     — 자치구의원
'시의회'     — 시(기초)의원
'군의회'     — 군의원
```

### 2-2. 선거구명 입력 규칙

**가장 중요한 부분이다.** 선거구명은 `local-election-9-dong-districts.json`이
반환하는 문자열과 **글자 하나, 공백 하나까지 정확히 일치**해야 매칭된다.

#### 구·시·군의원 (`local_council_district`)

형식: `"{시군구명} {선거구명}"`

```
중구 나선거구        ✅
송파구 가선거구      ✅
나선거구             ❌  (시군구명 없음 — 매칭 실패)
중구  나선거구       ❌  (공백 두 칸 — 매칭 실패)
```

정확한 시군구명과 선거구명은 **선거구 획정 공고문** 또는
재생성된 JSON 파일에서 확인한다.

JSON에서 확인하는 방법:

```bash
node -e "
const d = require('./src/lib/geo/data/local-election-9-dong-districts.json');
const code = '1168010100';  // 확인하려는 동코드
console.log(d.byAdministrativeDongCode[code]);
"
```

#### 시·도의원 (`metro_council_district`)

선관위 API 원문을 그대로 사용한다. 중간점(·)에 주의.

```
중·성동 제1선거구    ✅
중성동 제1선거구     ❌  (중간점 누락 — 매칭 실패)
```

### 2-3. 등록 방법

현재는 Supabase 대시보드에서 candidates 테이블에 직접 행을 삽입한다.

1. [Supabase 대시보드](https://supabase.com) → Table Editor → `candidates`
2. `Insert row` 클릭
3. 위 필드 입력
4. 후보자 계정(이메일)과 연결이 필요하면 `auth.users`의 `id`를 `user_id`에 입력

### 2-4. 등록 후 검증

후보자가 답변을 작성한 뒤, 해당 동에 위치한 사용자의 피드 최상단에
노출되는지 확인한다.

피드 API에서 직접 검증하는 방법:

```bash
# dongCode: 해당 선거구에 속하는 동코드 10자리
curl "https://herebtw2.vercel.app/api/feed/nearby?\
latitudeBucket100m=<값>&longitudeBucket100m=<값>&dongCode=<동코드10자리>"
```

응답의 첫 번째 항목이 해당 후보의 답변이 달린 글이면 정상.

---

## 3. 선거 종료 후 처리 (미결정)

2026-06-03 선거 종료 후 아래 사항을 결정해야 한다.

- 피드 지역구 우선 정렬 비활성화 여부
- 후보자 답변·한마디 섹션 노출 유지 여부
- candidates 테이블 비활성화 방법 (status 컬럼 추가 등)
