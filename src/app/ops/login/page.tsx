import { redirect } from "next/navigation";
import { getOpsSession, isSafeOpsNextPath } from "../../../lib/moderation/ops-auth";

export const dynamic = "force-dynamic";

export default async function OpsLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const next = isSafeOpsNextPath(params.next ?? null);
  if (await getOpsSession()) redirect(next);
  return (
    <main style={{ background: "#f7f7f8", minHeight: "100dvh", padding: "64px 20px" }}>
      <form action="/api/ops/session" method="post" style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 16, margin: "0 auto", maxWidth: 420, padding: 28 }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>콘텐츠 검수 로그인</h1>
        <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.5, margin: "0 0 24px" }}>운영자 전용 64자리 보안 키를 입력하세요. 키는 서버에서만 확인되며 저장되지 않습니다.</p>
        <input name="next" type="hidden" value={next} />
        <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 8 }} htmlFor="secret">운영 보안 키</label>
        <input autoComplete="current-password" autoFocus id="secret" name="secret" pattern="[0-9a-f]{64}" required type="password" style={{ border: "1px solid #d1d5db", borderRadius: 10, boxSizing: "border-box", fontFamily: "monospace", fontSize: 15, padding: "12px 14px", width: "100%" }} />
        {params.error ? <p role="alert" style={{ color: "#b91c1c", fontSize: 13 }}>보안 키를 확인해 주세요.</p> : null}
        <button style={{ background: "#111827", border: 0, borderRadius: 10, color: "white", cursor: "pointer", fontSize: 15, fontWeight: 700, marginTop: 18, padding: 13, width: "100%" }} type="submit">검수 화면 열기</button>
      </form>
    </main>
  );
}
