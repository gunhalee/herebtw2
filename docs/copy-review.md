# Copy Review

Generated: 2026-08-24T09:10:55.841Z

이 문서는 `npm run generate:copy-review`로 생성됩니다.
화면 문구, 시스템 메시지, 샘플/참조 라벨을 파일별로 모아 검토할 수 있게 정리했습니다.

## UI & Screen Copy

사용자가 화면에서 직접 보게 되는 문구입니다.

### src/app/(public)/voices/candidate/[id]/loading.tsx

- L27: 후보 답변 모아보기를 불러오는 중입니다.

### src/app/auth/login/page.tsx

- L30: 이메일 또는 비밀번호를 확인해 주세요.
- L36: 로그인 중 오류가 발생했습니다.
- L72: 후보 로그인
- L81: 관리자로부터 받은 계정으로 로그인하세요.
- L102: 이메일
- L133: 비밀번호
- L180: 로그인 중...
- L180: 로그인
- L194: 유권자 메인으로 돌아가기

### src/app/candidate/dashboard/error.tsx

- L15: 대시보드를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
- L21: 다시 시도

### src/app/candidate/dashboard/loading.tsx

- L15: 후보자 대시보드
- L17: 지역의 답변 대기 글을 불러오고 있습니다.

### src/app/candidate/reply/[postId]/error.tsx

- L15: 답변할 글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
- L21: 다시 시도

### src/app/candidate/reply/[postId]/loading.tsx

- L8: 답변할 글을 확인하고 있습니다.

### src/app/not-found.tsx

- L22: 여기 근데
- L31: 요청하신 화면을 찾지 못했어요.

### src/app/ops/login/page.tsx

- L17: 콘텐츠 검수 로그인
- L18: 운영자 전용 64자리 보안 키를 입력하세요. 키는 서버에서만 확인되며 저장되지 않습니다.
- L20: 운영 보안 키
- L22: 보안 키를 확인해 주세요.
- L23: 검수 화면 열기

### src/app/ops/moderation/[casePublicId]/page.tsx

- L33: 증거를 복호화하거나 무결성을 확인할 수 없습니다. 키 버전과 데이터 상태를 확인하세요.
- L39: ← 검수 목록
- L40: 검수 건 {casePublicId.slice(0, 8)}
- L43: 격리된 원문
- L44: 보존 기간이 지나 원문이 삭제되었습니다.
- L44: {plaintext ?? "보존 기간이 지나 원문이 삭제되었습니다."}
- L46: 없음
- L46: 판정 근거
- L46: {item.reason_codes.join(", ") || "없음"}
- L50: 결정 사유 코드
- L52: 내부 메모
- L55: 복구·공개
- L55: 공개 승인
- L55: {item.state === "rejected" ? "복구·공개" : "공개 승인"}
- L56: 게시 거절
- L60: 결정 이력

### src/app/ops/moderation/page.tsx

- L15: 콘텐츠 검수
- L16: 웹 화면이 최종 기록입니다. Telegram은 알림과 진입 링크만 제공합니다.
- L21: 해당 상태의 검수 건이 없습니다.
- L24: 규칙 근거 없음
- L24: {item.reason_codes.join(", ") || "규칙 근거 없음"}

### src/components/candidate/candidate-dashboard-api.ts

- L11: 글을 더 불러오지 못했습니다.
- L13: 목록 요청이 지연되고 있어요. 다시 시도해 주세요.

### src/components/candidate/candidate-dashboard-filters.tsx

- L13: 답변 대기
- L14: 내가 답변한 글

### src/components/candidate/candidate-dashboard-header.tsx

- L34: candidateName} 후보

### src/components/candidate/candidate-dashboard-load-more.tsx

- L33: 글을 더 불러오지 못했습니다.
- L46: 불러오는 중...
- L46: 더 보기

### src/components/candidate/candidate-dashboard-post-list.tsx

- L43: 주민 목소리
- L57: 아직 글이 없습니다.
- L99: 주민 {post.agree_count}명이 관심을 보인 목소리입니다
- L127: 공감 {post.agree_count}
- L151: 내 답변:
- L165: 약속

### src/components/candidate/candidate-dashboard-stats-grid.tsx

- L21: 전체 글
- L22: 답변 완료
- L23: 미답변
- L24: 답변률

### src/components/candidate/candidate-first-message-api.ts

- L34: 첫 마디를 등록하지 못했습니다.
- L38: 첫 마디 등록이 지연되고 있어요. 다시 시도해 주세요.
- L46: 저장에 실패했습니다. 다시 시도해 주세요.
- L50: 저장 요청이 지연되고 있어요. 다시 시도해 주세요.

### src/components/candidate/candidate-first-message-panel.tsx

- L54: 후보자 한마디
- L103: 취소
- L126: 저장
- L162: 수정

### src/components/candidate/candidate-logout-button.tsx

- L35: 로그아웃

### src/components/candidate/candidate-messages-api.ts

- L22: 후보의 한마디를 불러오지 못했습니다. 새로고침을 해주세요.
- L25: 후보의 한마디 로딩이 지연되고 있어요. 새로고침을 해주세요.

### src/components/candidate/candidate-messages-section.tsx

- L119: 우리 동네 후보
- L164: 다른 후보 더보기

### src/components/candidate/candidate-messages-view.tsx

- L57: 기초의회
- L57: 광역의회
- L85: 기초의회
- L87: 광역의회
- L188: 후보
- L188: ${councilBadge} 후보

### src/components/candidate/candidate-mfa-panel.tsx

- L44: 추가 인증 정보를 확인하지 못했습니다. 다시 로그인해 주세요.
- L65: 여기 근데 후보자 대시보드
- L68: 인증 앱 등록을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.
- L88: 인증 앱에 표시된 6자리 코드를 입력해 주세요.
- L98: 인증 코드가 올바르지 않거나 만료되었습니다. 새 코드를 입력해 주세요.
- L115: 후보자 추가 인증
- L117: 후보자 계정과 답변을 보호하기 위해 인증 앱의 일회용 코드를 확인합니다.
- L121: 인증 정보를 확인하고 있습니다...
- L125: 처음 한 번만 등록해 주세요
- L127: Google Authenticator 등 인증 앱을 여세요.
- L128: 아래 QR 코드를 스캔하세요.
- L129: 앱에 표시된 6자리 코드를 입력하세요.
- L133: QR 코드를 스캔할 수 없나요?
- L141: 6자리 인증 코드
- L155: 확인 중...
- L155: 인증하고 계속
- L161: 다른 계정으로 로그인

### src/components/candidate/candidate-onboarding-form.tsx

- L42: ${district} 주민 여러분, 여러분의 이야기를 잘 듣겠습니다.
- L42: "${district} 주민 여러분, 여러분의 이야기를 잘 듣겠습니다."
- L94: 등록 중...
- L94: ${candidateName} 후보 첫 메시지 등록

### src/components/candidate/candidate-reply-api.ts

- L28: 답변 등록에 실패했습니다.
- L32: 답변 등록이 지연되고 있어요. 다시 시도해 주세요.

### src/components/candidate/candidate-reply-confirm-dialog.tsx

- L62: 답변을 등록하시겠습니까?
- L72: 답변은 등록 후 수정할 수 없습니다.
- L73: 이 답변은 '약속' 으로 기록됩니다.
- L73: 약속
- L94: 취소
- L114: 등록 중...
- L114: 등록

### src/components/candidate/candidate-reply-form.tsx

- L90: ${candidateName} 후보로서 주민분께 짧게 답변을 남겨 주세요.
- L155: 이 답변은 공약입니다.
- L183: 당선 후 3개월
- L184: 당선 후 6개월
- L185: 당선 후 1년
- L186: 직접 입력
- L233: 답변 등록

### src/components/candidate/dashboard-screen.tsx

- L56: 첫 메시지 내용을 안전하게 확인하고 있어요. 확인이 끝나기 전에는 주민에게 공개되지 않습니다.

### src/components/candidate/onboarding-screen.tsx

- L63: candidateName} 후보님, 환영합니다.
- L73: district} 주민분들께 첫 인사를 남겨 주세요.
- L75: 첫 메시지는 글 목록 상단에 고정됩니다.

### src/components/candidate/promise-archive-list.tsx

- L25: 선거일까지 D-${daysUntil}
- L44: D+${daysSinceElection} / 기한까지 ${daysUntilDeadline}일
- L50: 기한 D+${daysOverdue} 경과
- L97: 약속답변
- L167: promise.candidate_name} 후보
- L187: 기한: {promise.promise_deadline
- L219: 약속 목록 ({promises.length
- L231: 아직 등록된 약속이 없습니다.

### src/components/candidate/promise-archive-screen.tsx

- L40: 홈으로
- L62: candidate.name} 후보
- L86: {stats.repliedPosts}명
- L87: {stats.promiseCount}건
- L88: stats.replyRate}%입니다.
- L115: 나도 목소리 남기기

### src/components/candidate/reply-compose-screen.tsx

- L61: 답변 작성

### src/components/candidate/use-candidate-first-message-editor.ts

- L33: 100자 이내로 입력해주세요.
- L52: 수정 내용을 안전하게 확인하고 있어요. 확인 전까지 기존 메시지가 표시됩니다.
- L64: 수정에 실패했습니다. 다시 시도해 주세요.

### src/components/candidate/use-candidate-onboarding.ts

- L43: 첫 메시지를 등록하지 못했습니다. 다시 시도해 주세요.

### src/components/candidate/use-candidate-reply-compose.ts

- L66: 답변 등록에 실패했습니다.

### src/components/common/empty-state.tsx

- L14: 아직 이 지역의 목소리가 없어요
- L15: 첫 번째 목소리를 남겨보세요.

### src/components/common/error-state.tsx

- L13: 문제가 발생했어요. 잠시 후 다시 시도해주세요.

### src/components/common/loading-state.tsx

- L13: 불러오는 중입니다

### src/components/common/veil-overlay.tsx

- L6: 우리 동네 글을 불러오는 중입니다.

### src/components/home/administrative-area-search-dialog.tsx

- L55: 동네를 검색하지 못했습니다.
- L62: 동네 검색이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.
- L82: 동네를 검색하지 못했습니다.
- L151: 작성할 지역 찾기
- L161: 동·읍·면부터 시·도까지 선택할 수 있어요.
- L204: 예: 성수1가1동, 서울 강남구

### src/components/home/administrative-area-search-results.tsx

- L22: 시·도
- L26: 시·군·구
- L29: 동·읍·면
- L68: 동네 이름을 두 글자 이상 입력해 주세요.
- L70: 같은 이름이 많다면 시·군·구를 함께 입력해 주세요.
- L84: 지역을 찾고 있어요...
- L114: 검색 결과가 없어요. 더 큰 지역 단위를 입력해주세요.
- L116: 예: 성수1가1동 → 서울 성동구

### src/components/home/compose-permission-dialog.tsx

- L55: 지역 직접 선택
- L203: 나중에

### src/components/home/dong-posts-feed-content.tsx

- L42: 더 보기
- L100: 불러오는 중

### src/components/home/floating-compose-button.tsx

- L19: 위치 확인 중...

### src/components/home/home-report-dialogs.tsx

- L76: 신속하게 확인하겠습니다. 불편을 드려 죄송합니다.
- L93: 확인
- L138: 이 글을 신고할까요?
- L166: 닫기
- L185: 신고 처리 중
- L185: 예

### src/components/home/home-static-screen.tsx

- L20: 우리 동네
- L21: 기초의회
- L22: 광역의회
- L194: ${candidate.councilType} 후보
- L195: 후보
- L371: 우리 동네 후보
- L412: 더 보기
- L680: 의원
- L680: ${replyCouncilBadgeLabel.replace(/의회$/, "의원")} 후보
- L681: 후보
- L694: 약속

### src/components/home/location-access-banner.tsx

- L29: 지역 직접 선택
- L63: 위치 확인 중...
- L74: 브라우저의 위치 권한 요청을 확인해 주세요.
- L97: 위치 확인 중...

### src/components/home/pending-feed-updates-button.tsx

- L46: 새 글 {count}개 이어보기

### src/components/home/refresh-home-feed-after-compose.ts

- L41: 등록 후 목록을 새로고침하지 못했습니다.

### src/components/home/use-home-location-access.ts

- L148: 주변 글을 불러오지 못했어요.

### src/components/home/use-home-shell-state.ts

- L15: 우리 동네

### src/components/post/post-compose-form.tsx

- L68: 지금 여기에 한마디 해주세요.
- L120: 후보자가 답변하면 알려드릴까요?
- L125: 이메일 주소 (선택)
- L148: 입력한 주소로 확인 메일을 보내며, 확인한 경우에만 답변 알림을 보내드립니다.
- L188: 위치 확인 중...
- L188: 위치 재확인
- L213: 같은 내용의 글이 이미 있어요. 내용을 조금 수정한 뒤 다시 시도해 주세요.

### src/components/post/post-compose-header.tsx

- L77: ${locationDisplayName}에 남기기
- L78: 위치 확인 중...
- L98: 지역 변경
- L119: 등록 중...
- L119: 등록

### src/components/post/post-compose-success.tsx

- L30: /** viewBox 1:1 SVG — width·height 동일로만 그려 비율이 깨지지 않게 함 */
- L153: 내용을 안전하게 확인하고 있어요
- L154: 당신의 목소리가 전달되었습니다
- L165: 확인이 끝나면 게시 여부가 반영됩니다. 확인 전에는 다른 사람에게 공개되지 않아요.
- L168: ${displayDongName}에 남긴 목소리를 포토카드로 저장해보세요.
- L170: 링크를 통해서 후보자의 답글을 확인할 수도 있어요.
- L174: 답변 알림을 받으려면 받은 이메일에서 주소를 확인해 주세요.
- L214: 복사됨
- L219: 링크 복사하기
- L249: 이미지 준비 중...
- L249: 포토카드 다운로드
- L270: 닫기

### src/components/post/use-compose-location.ts

- L74: 현재 위치 범위가 넓습니다. 정확한 동네 이름이 표시되지 않을 수 있어요.
- L77: 현재 위치 정확도가 약 ${Math.round(locationSession.accuracyMeters)}m입니다. 위치가 다르면 다시 확인해 주세요.
- L125: 위치 정보를 로드하고 있어요. 잠시만 기다려주세요.

### src/components/sheet/post-list-item-card.tsx

- L74: 구·시·군의회
- L129: /* 답변 있는 카드: 왼쪽 노란 띠 */
- L142: /* 원글 영역 */
- L218: /* 답변 영역 — CandidateMessageCard 스타일 그대로 */
- L228: /* 프로필 사진 */
- L267: /* 태그·이름·본문 */
- L275: /* 메타 행: 이름 · 선거구 + 의회 태그 */
- L307: 의원
- L307: ${replyCouncilBadge.replace(/의회$/, "의원")} 후보
- L308: 후보
- L321: 약속
- L325: /* 답변 본문 */

### src/components/sheet/post-list-item-menu.tsx

- L50: 신고하기

### src/components/voice/voice-detail-screen.tsx

- L103: 이메일 확인이 완료됐어요. 후보자가 답변하면 알려드릴게요.
- L104: 확인 링크가 만료됐거나 올바르지 않아요.
- L171: 이미지 준비 중...
- L171: 포토카드 다운로드

### src/lib/content/home-copy.ts

- L15: 위원장님!
- L16: 한마디 할게요
- L18: 이 곳에 첫 한마디를 남겨주세요.
- L22: 여기
- L24: 인데요

### src/lib/content/share-metadata.ts

- L1: 여기 근데
- L2: 한마디 할게요

### src/lib/content/voice-page.ts

- L3: /** 공유 링크·포토카드 상단 배너 문구 */
- L8: 후보님, ${place}인데요

## System & API Messages

에러, 검증, 등록/요청 실패 등 시스템 응답 문구입니다.

### src/app/api/candidate/dashboard/posts/route.ts

- L25: 새 목록 경로가 아직 활성화되지 않았습니다.
- L33: 인증이 필요합니다.
- L39: 추가 인증이 필요합니다.
- L50: 목록 위치가 올바르지 않습니다.
- L64: 목록을 불러오지 못했습니다.

### src/app/api/candidate/first-message/route.ts

- L21: 인증이 필요합니다.
- L25: 활성화된 후보자만 작성할 수 있습니다.
- L29: 수정하려면 추가 인증이 필요합니다.
- L43: 첫 메시지가 없습니다.
- L55: 내용은 1~100자여야 합니다.
- L99: 인증이 필요합니다.
- L103: 활성화된 후보자만 작성할 수 있습니다.
- L107: 등록하려면 추가 인증이 필요합니다.
- L122: 이미 첫 메시지를 작성했습니다.
- L137: 내용은 1~100자여야 합니다.

### src/app/api/candidate/replies/route.ts

- L38: 인증이 필요합니다.
- L45: 활성화된 후보자만 답변할 수 있습니다.
- L53: 답변하려면 추가 인증이 필요합니다.
- L83: 요청 식별자가 올바르지 않습니다.
- L96: 답변은 1~2,000자여야 합니다.

### src/app/api/device/register/route.ts

- L38: 기기를 등록하지 못했습니다.
- L68: 짧은 시간에 여러 번 요청했어요. ${budget.retryAfterSeconds}초 후 다시 시도해 주세요.
- L92: 기기 보호 기능을 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.

### src/app/api/location/resolve/route.ts

- L39: 유효한 위치 좌표가 필요해요.
- L54: 잠시 후 다시 시도해 주세요.
- L61: 잠시 후 다시 시도해 주세요.
- L115: 유효한 위치 좌표가 필요해요.
- L121: 현재 위치에서는 동네를 확인할 수 없어요.
- L127: 위치 확인이 지연되고 있어요. 다시 시도해 주세요.
- L133: 위치 확인 요청이 많아요. 잠시 후 다시 시도해 주세요.
- L138: 현재 위치를 확인하지 못했어요.

### src/app/api/location/search/route.ts

- L33: 동네 이름을 두 글자 이상 입력해 주세요.
- L48: 잠시 후 다시 시도해 주세요.
- L55: 잠시 후 다시 시도해 주세요.
- L94: 동네 검색이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.
- L95: 동네를 검색하지 못했습니다. 잠시 후 다시 시도해 주세요.

### src/app/api/posts/[postId]/agree/toggle/route.ts

- L44: 기기 정보를 확인할 수 없습니다.
- L72: 짧은 시간에 여러 번 요청했어요. ${budget.retryAfterSeconds}초 후 다시 시도해 주세요.
- L101: 잠시 후 다시 시도해 주세요.

### src/app/api/posts/[postId]/report/route.ts

- L48: 기기 정보를 확인할 수 없습니다.
- L76: 짧은 시간에 여러 번 요청했어요. ${budget.retryAfterSeconds}초 후 다시 시도해 주세요.
- L113: 잠시 후 다시 시도해 주세요.

### src/app/api/posts/route.ts

- L105: 유효한 위치 좌표가 필요해요.
- L122: 선택한 지역이 만료되었습니다. 지역을 다시 선택해 주세요.
- L147: 요청 식별자가 올바르지 않습니다. 다시 시도해 주세요.
- L162: 보호 기능을 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.
- L172: 기기 정보를 확인할 수 없습니다. 새로고침 후 다시 시도해 주세요.
- L223: 짧은 시간에 여러 번 요청했어요. ${deviceBudget.retryAfterSeconds}초 후 다시 시도해 주세요.
- L261: 보호 기능을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.
- L294: 선택한 지역이 만료되었습니다. 지역을 다시 선택해 주세요.
- L305: 현재 위치를 확인하지 못했어요.
- L356: 같은 내용의 글을 이미 남겼어요.
- L365: 글을 저장하지 못했습니다.

### src/app/api/telegram/moderation/route.ts

- L34: 읽기 전용 명령\n/status 전체 상태\n/queue 검수 대기 상태\n결정과 원문 열람은 웹 운영 도구에서만 가능합니다.
- L40: 검수 대기: ${status.openCases}건\n가장 오래된 건: ${status.oldestAgeMinutes}분\n${baseUrl}/ops/moderation
- L41: moderation 상태\n대기: ${status.openCases}건\n가장 오래된 건: ${status.oldestAgeMinutes}분\nGoogle 호출: ${status.googleRequests}건\n예상 비용: $${status.estimatedGoogleCostUsd.toFixed(2)}

### src/components/home/home-feed-api.ts

- L112: 동네 글을 불러오지 못했습니다.
- L128: 피드 갱신에 실패했습니다.
- L146: 공감 상태를 갱신하지 못했습니다.
- L162: 전역 피드를 불러오지 못했습니다.

### src/components/home/home-post-api.ts

- L22: 맞아요 상태를 반영하지 못했습니다.
- L28: 맞아요 반영이 지연되고 있어요. 다시 시도해주세요.
- L38: 신고를 접수하지 못했습니다.
- L45: 신고 접수가 지연되고 있어요. 다시 시도해주세요.
- L49: 신고를 접수하지 못했습니다.

### src/components/home/use-home-agree-actions.ts

- L88: 맞아요 상태를 반영하지 못했습니다.

### src/components/home/use-home-feed-list-actions.ts

- L108: 목록을 더 불러오지 못했습니다.

### src/components/home/use-home-report-actions.ts

- L115: 신고가 접수되었어요.
- L119: 신고를 접수하지 못했습니다.

### src/components/post/use-compose-submit.ts

- L91: 위치 정보를 로드하고 있어요. 잠시만 기다려주세요.
- L124: 죄송합니다. 저장을 실패하였습니다.
- L138: 저장이 지연되고 있습니다. 잠시 후에 다시 시도해주세요.
- L166: 죄송합니다. 저장을 실패하였습니다.

### src/lib/device/browser-device.ts

- L87: 디바이스 등록에 실패했습니다.
- L92: 기기 등록이 지연되고 있어요. 다시 시도해주세요.
- L106: 브라우저에서 디바이스를 준비하지 못했습니다.

### src/lib/geo/browser-administrative-location-resolver.ts

- L21: 현재 위치를 행정동으로 확인하지 못했습니다.
- L26: 현재 위치 확인이 지연되고 있어요. 다시 시도해 주세요.

### src/lib/posts/mutations.ts

- L151: 안전 확인 중인 글입니다.

### src/lib/posts/validators.ts

- L7: 내용은 1자 이상 100자 이하로 입력해 주세요.

## Display Labels

시간, 거리, 상태처럼 공통 표시용 짧은 라벨입니다.

### src/lib/geo/format-bucketed-distance.ts

- L12: 전체 피드
- L20: 거리 미확인
- L24: 100m 이내

### src/lib/utils/datetime.ts

- L9: 방금 전
- L13: ${Math.floor(diffSeconds / 60)}분 전
- L17: ${Math.floor(diffSeconds / 3600)}시간 전
- L20: ${Math.floor(diffSeconds / 86400)}일 전

## Reference Geographic Labels

행정구역 표시나 동 코드처럼 운영 기준이 되는 명칭 데이터입니다.

### src/lib/geo/data/known-dong-codes.json

- L2: 역삼1동
- L3: 역삼2동
- L4: 논현1동
- L5: 서교동
- L6: 연남동
- L7: 합정동
- L8: 잠실본동
- L9: 방이1동
- L10: 문정1동
- L11: 우1동
- L12: 중1동
- L13: 좌1동
- L14: 남천2동
- L15: 광안1동
- L16: 민락동
- L17: 온천1동
- L18: 명륜동
- L19: 사직1동
- L20: 송도1동
- L21: 동춘1동
- L22: 연수1동
- L23: 부평1동
- L24: 삼산1동
- L25: 갈산1동
- L26: 구월1동
- L27: 논현고잔동
- L28: 만수1동

### src/lib/geo/format-administrative-area.ts

- L36: 서울특별시
- L36: 서울
- L37: 부산광역시
- L37: 부산
- L38: 대구광역시
- L38: 대구
- L39: 인천광역시
- L39: 인천
- L40: 광주광역시
- L40: 광주
- L41: 대전광역시
- L41: 대전
- L42: 울산광역시
- L42: 울산
- L43: 세종특별자치시
- L43: 세종
- L44: 경기도
- L44: 경기
- L45: 강원특별자치도
- L45: 강원
- L46: 강원도
- L46: 강원
- L47: 충청북도
- L47: 충북
- L48: 충청남도
- L48: 충남
- L49: 전북특별자치도
- L49: 전북
- L50: 전라북도
- L50: 전북
- L51: 전라남도
- L51: 전남
- L52: 경상북도
- L52: 경북
- L53: 경상남도
- L53: 경남
- L54: 제주특별자치도
- L54: 제주
- L55: 제주도
- L55: 제주
- L59: 경기
- L60: 경기도
- L61: 강원
- L62: 강원도
- L63: 강원특별자치도
- L64: 충북
- L65: 충청북도
- L66: 충남
- L67: 충청남도
- L68: 전북
- L69: 전라북도
- L70: 전북특별자치도
- L71: 전남
- L72: 전라남도
- L73: 경북
- L74: 경상북도
- L75: 경남
- L76: 경상남도
- L77: 제주
- L78: 제주도
- L79: 제주특별자치도
