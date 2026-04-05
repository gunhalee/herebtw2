"use client";

const reportReasons = [
  "혐오·비방",
  "허위정보",
  "광고·도배",
  "기타 운영정책 위반",
];

export function PostReportDialog() {
  return (
    <dialog open={false}>
      <h3>이 포스트를 신고할까요?</h3>
      <ul>
        {reportReasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <div>
        <button type="button">닫기</button>
        <button type="button">신고하기</button>
      </div>
    </dialog>
  );
}
