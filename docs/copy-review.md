# Copy Review

Generated: 2026-04-12T12:15:02.965Z

이 문서는 `npm run generate:copy-review`로 생성됩니다.
화면 문구, 시스템 메시지, 샘플/참조 라벨을 파일별로 모아 검토할 수 있게 정리했습니다.

## UI & Screen Copy

사용자가 화면에서 직접 보게 되는 문구입니다.

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

### src/app/not-found.tsx

- L22: 여기 근데
- L31: 요청하신 화면을 찾지 못했어요.

### src/components/candidate/candidate-dashboard-header.tsx

- L38: candidateName} 후보
- L67: 로그아웃

### src/components/candidate/candidate-dashboard-post-list.tsx

- L43: 주민 목소리
- L57: 아직 글이 없습니다.
- L98: 주민 {post.agree_count}명이 관심을 보인 목소리입니다
- L126: 공감 {post.agree_count}
- L150: 내 답변:
- L164: 약속

### src/components/candidate/candidate-dashboard-stats-grid.tsx

- L23: 전체 글
- L24: 답변 완료
- L25: 미답변
- L26: 답변률

### src/components/candidate/candidate-first-message-api.ts

- L31: 첫 마디를 등록하지 못했습니다.
- L35: 첫 마디 등록이 지연되고 있어요. 다시 시도해 주세요.
- L43: 저장에 실패했습니다. 다시 시도해 주세요.
- L47: 저장 요청이 지연되고 있어요. 다시 시도해 주세요.

### src/components/candidate/candidate-first-message-panel.tsx

- L52: 후보자 한마디
- L101: 취소
- L124: 저장
- L160: 수정

### src/components/candidate/candidate-messages-api.ts

- L22: 후보의 한마디를 불러오지 못했습니다. 새로고침을 해주세요.
- L25: 후보의 한마디 로딩이 지연되고 있어요. 새로고침을 해주세요.

### src/components/candidate/candidate-messages-section.tsx

- L73: 우리 동네 후보
- L118: 다른 후보들도 살펴보기

### src/components/candidate/candidate-messages-view.tsx

- L32: 기초의회
- L32: 광역의회
- L54: 기초의회
- L56: 광역의회
- L155: 후보
- L155: ${councilBadge} 후보

### src/components/candidate/candidate-onboarding-form.tsx

- L42: ${district} 주민 여러분, 여러분의 이야기를 잘 듣겠습니다.
- L42: "${district} 주민 여러분, 여러분의 이야기를 잘 듣겠습니다."
- L94: 등록 중...
- L94: ${candidateName} 후보 첫 메시지 등록

### src/components/candidate/candidate-reply-api.ts

- L27: 답변 등록에 실패했습니다.
- L31: 답변 등록이 지연되고 있어요. 다시 시도해 주세요.

### src/components/candidate/candidate-reply-confirm-dialog.tsx

- L62: 답변을 등록하시겠습니까?
- L72: 답변은 등록 후 수정할 수 없습니다.
- L73: 이 답변은 '약속' 으로 기록됩니다.
- L73: 약속
- L94: 취소
- L114: 등록 중...
- L114: 등록

### src/components/candidate/candidate-reply-form.tsx

- L89: ${candidateName} 후보로서 주민분께 짧게 답변을 남겨 주세요.
- L150: 이 답변은 공약입니다.
- L178: 당선 후 3개월
- L179: 당선 후 6개월
- L180: 당선 후 1년
- L181: 직접 입력
- L228: 답변 등록

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

- L35: 100자 이내로 입력해주세요.
- L53: 수정에 실패했습니다. 다시 시도해 주세요.

### src/components/candidate/use-candidate-onboarding.ts

- L43: 첫 메시지를 등록하지 못했습니다. 다시 시도해 주세요.

### src/components/candidate/use-candidate-reply-compose.ts

- L62: 답변 등록에 실패했습니다.

### src/components/common/empty-state.tsx

- L14: 아직 이 지역의 목소리가 없어요
- L15: 첫 번째 목소리를 남겨보세요.

### src/components/common/error-state.tsx

- L13: 문제가 발생했어요. 잠시 후 다시 시도해주세요.

### src/components/common/loading-state.tsx

- L13: 불러오는 중입니다

### src/components/home/compose-permission-dialog.tsx

- L55: 글을 작성하려면 위치 권한 허용이 필요해요.
- L78: 닫기
- L94: 다시 시도

### src/components/home/dong-posts-feed-content.tsx

- L42: 더 보기
- L100: 불러오는 중

### src/components/home/dong-posts-feed-veil.tsx

- L6: 주민들의 한마디를 보기 위해 위치 권한을 허용해주세요.

### src/components/home/home-report-dialogs.tsx

- L76: 신속하게 확인하겠습니다. 불편을 드려 죄송합니다.
- L93: 확인
- L138: 이 글을 신고할까요?
- L166: 닫기
- L185: 신고 처리 중
- L185: 예

### src/components/home/pending-feed-updates-button.tsx

- L46: 새 글 {count}개 이어보기

### src/components/home/use-home-shell-state.ts

- L29: 우리 동네

### src/components/post/post-compose-form.tsx

- L61: 닫기
- L79: 여기 남기기
- L99: 등록 중...
- L99: 등록
- L115: 지금 여기에서 글을 남겨보세요.
- L167: 후보자가 답변하면 알려드릴까요?
- L172: 이메일 주소 (선택)
- L195: 이메일은 답변 알림 용도로만 사용되며, 다른 목적으로 쓰지 않습니다.
- L219: 같은 내용의 글이 이미 있어요. 내용을 조금 수정한 뒤 다시 시도해 주세요.

### src/components/post/post-compose-success.tsx

- L30: /** viewBox 1:1 SVG — width·height 동일로만 그려 비율이 깨지지 않게 함 */
- L148: 당신의 목소리가 전달되었습니다
- L158: ${displayDongName}에 남긴 목소리를 포토카드로 저장해보세요.
- L160: 링크를 통해서 후보자의 답글을 확인할 수도 있어요.
- L195: 복사됨
- L200: 링크 복사하기
- L230: 이미지 준비 중...
- L230: 포토카드 다운로드
- L250: 닫기

### src/components/post/use-compose-location.ts

- L72: 현재 위치 확인이 끝난 뒤에 글을 등록할 수 있어요.

### src/components/sheet/post-list-item-card.tsx

- L62: 구·시·군의회
- L117: /* 답변 있는 카드: 왼쪽 노란 띠 */
- L130: /* 원글 영역 */
- L206: /* 답변 영역 — CandidateMessageCard 스타일 그대로 */
- L216: /* 프로필 사진 */
- L251: /* 태그·이름·본문 */
- L259: /* 메타 행: 이름 · 선거구 + 의회 태그 */
- L291: 의원
- L291: ${replyCouncilBadge.replace(/의회$/, "의원")} 후보
- L292: 후보
- L305: 약속
- L309: /* 답변 본문 */

### src/components/sheet/post-list-item-menu.tsx

- L50: 신고하기

### src/components/voice/voice-detail-screen.tsx

- L148: 이미지 준비 중...
- L148: 포토카드 다운로드

### src/lib/content/home-copy.ts

- L15: 여기 근데
- L16: 한마디 할게요
- L18: 아직 이 근처엔 올라온 이야기가 없어요
- L22: 후보님 여기
- L24: 인데요

### src/lib/content/share-metadata.ts

- L1: 여기 근데
- L2: 한마디 할게요

### src/lib/content/voice-page.ts

- L3: /** 공유 링크·포토카드 상단 배너 문구 */
- L8: 후보님, ${place}인데요

## System & API Messages

에러, 검증, 등록/요청 실패 등 시스템 응답 문구입니다.

### src/app/api/candidate/first-message/route.ts

- L17: 인증이 필요합니다.
- L21: 첫 메시지가 없습니다.
- L33: 내용은 1~100자여야 합니다.
- L54: 인증이 필요합니다.
- L59: 이미 첫 메시지를 작성했습니다.
- L74: 내용은 1~100자여야 합니다.

### src/app/api/candidate/replies/route.ts

- L17: 인증이 필요합니다.
- L31: 답변은 1~200자여야 합니다.

### src/app/api/card/[uuid]/route.ts

- L29: ${input.councilType.trim()} 후보
- L30: 후보

### src/app/api/device/register/route.ts

- L22: anonymousDeviceId가 필요합니다.

### src/app/api/location/resolve/route.ts

- L30: 유효한 위치 좌표가 필요해요.
- L60: 유효한 위치 좌표가 필요해요.
- L61: 현재 위치를 확인하지 못했어요.

### src/app/api/posts/[postId]/agree/toggle/route.ts

- L29: anonymousDeviceId가 필요합니다.

### src/app/api/posts/route.ts

- L63: anonymousDeviceId가 필요합니다.
- L73: 유효한 위치 좌표가 필요해요.
- L90: 현재 위치를 확인하지 못했어요.

### src/components/home/home-feed-api.ts

- L112: 동네 글을 불러오지 못했습니다.
- L128: 피드 갱신에 실패했습니다.
- L146: 공감 상태를 갱신하지 못했습니다.
- L162: 전역 피드를 불러오지 못했습니다.

### src/components/home/home-feed-bootstrap.ts

- L46: 브라우저에서 디바이스를 준비하지 못했습니다.
- L137: 피드를 불러오지 못했습니다.

### src/components/home/home-post-api.ts

- L22: 맞아요 상태를 반영하지 못했습니다.
- L28: 맞아요 반영이 지연되고 있어요. 다시 시도해주세요.
- L38: 신고를 접수하지 못했습니다.
- L45: 신고 접수가 지연되고 있어요. 다시 시도해주세요.
- L49: 신고를 접수하지 못했습니다.

### src/components/home/use-home-agree-actions.ts

- L88: 맞아요 상태를 반영하지 못했습니다.

### src/components/home/use-home-compose-flow.ts

- L103: 등록 후 목록을 새로고침하지 못했습니다.

### src/components/home/use-home-feed-list-actions.ts

- L108: 목록을 더 불러오지 못했습니다.

### src/components/home/use-home-report-actions.ts

- L115: 신고가 접수되었어요.
- L119: 신고를 접수하지 못했습니다.

### src/components/post/use-compose-submit.ts

- L75: 위치 정보를 로드하고 있어요. 잠시만 기다려주세요.
- L96: 글을 등록하지 못했어요.
- L108: 저장이 늦어졌어요. 잠시 후에 다시 시도해 주세요.
- L129: 글을 등록하지 못했어요.

### src/lib/device/browser-device.ts

- L92: 디바이스 등록에 실패했습니다.
- L97: 기기 등록이 지연되고 있어요. 다시 시도해주세요.
- L111: 브라우저에서 디바이스를 준비하지 못했습니다.

### src/lib/geo/browser-administrative-location-resolver.ts

- L21: 현재 위치를 행정동으로 확인하지 못했습니다.
- L27: 현재 위치 확인이 지연되고 있어요. 다시 시도해 주세요.
- L44: 현재 위치를 확인하지 못했어요. 다시 시도해 주세요.
- L48: 위치 권한을 허용하면 우리 동네에 글을 남길 수 있어요.
- L52: 위치 확인 시간이 초과됐어요. 다시 시도해 주세요.
- L56: 이 브라우저에서는 위치 정보를 사용할 수 없어요.
- L60: 현재 위치를 아직 찾지 못했어요. 다시 시도해 주세요.
- L63: 현재 위치를 확인하지 못했어요. 다시 시도해 주세요.

### src/lib/posts/mutations.ts

- L80: 내용을 다시 확인해 주세요.
- L98: 같은 내용의 글이 이미 있어요. 내용을 조금 수정해 다시 시도해 주세요.
- L147: anonymousDeviceId가 필요합니다.
- L157: 신고 사유 코드가 필요합니다.

### src/lib/posts/validators.ts

- L7: 내용은 1자 이상 100자 이하로 입력해 주세요.

## Display Labels

시간, 거리, 상태처럼 공통 표시용 짧은 라벨입니다.

### src/lib/geo/format-bucketed-distance.ts

- L11: 전체 피드
- L19: 거리 미확인
- L23: 100m 이내

### src/lib/utils/datetime.ts

- L9: 방금 전
- L13: ${Math.floor(diffSeconds / 60)}분 전
- L17: ${Math.floor(diffSeconds / 3600)}시간 전
- L20: ${Math.floor(diffSeconds / 86400)}일 전

## Sample & Placeholder Text

샘플 데이터, placeholder, 데모용 텍스트입니다.

### src/components/home/use-compose-dong-flashcard.ts

- L13: 우리 동네
- L16: 역삼1동
- L17: 연남동
- L18: 망원1동
- L19: 서교동
- L20: 삼청동
- L21: 정자동
- L22: 광안2동
- L23: 봉천동
- L24: 평창동
- L25: 효자동
- L26: 송도2동

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
