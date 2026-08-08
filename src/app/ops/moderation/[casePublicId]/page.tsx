import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { decryptModerationEvidence } from "../../../../lib/moderation/evidence-crypto";
import { getOpsSession } from "../../../../lib/moderation/ops-auth";
import { loadModerationCaseDetail, recordModerationAccess } from "../../../../lib/moderation/repository";

export const dynamic = "force-dynamic";

export default async function ModerationCasePage({ params }: { params: Promise<{ casePublicId: string }> }) {
  const { casePublicId } = await params;
  const session = await getOpsSession();
  if (!session) redirect(`/ops/login?next=${encodeURIComponent(`/ops/moderation/${casePublicId}`)}`);
  const detail = await loadModerationCaseDetail(casePublicId);
  if (!detail) notFound();
  let plaintext: string | null = null;
  let evidenceError: string | null = null;
  if (detail.evidence) {
    try {
      plaintext = decryptModerationEvidence({
        aadVersion: detail.evidence.aad_version,
        authTagBase64: detail.evidence.auth_tag_base64,
        casePublicId,
        ciphertextBase64: detail.evidence.ciphertext_base64,
        createdAt: detail.evidence.created_at,
        keyVersion: detail.evidence.key_version,
        nonceBase64: detail.evidence.nonce_base64,
        policyVersion: detail.moderationCase.policy_version,
      });
      const requestHeaders = await headers();
      await recordModerationAccess({ action: "view_plaintext", caseId: detail.moderationCase.id, operatorId: session.operatorId, requestId: requestHeaders.get("x-vercel-id") ?? undefined });
    } catch {
      evidenceError = "증거를 복호화하거나 무결성을 확인할 수 없습니다. 키 버전과 데이터 상태를 확인하세요.";
    }
  }
  const item = detail.moderationCase;
  return (
    <main style={{ margin: "0 auto", maxWidth: 800, padding: "32px 20px 80px" }}>
      <Link href="/ops/moderation" style={{ color: "#4b5563" }}>← 검수 목록</Link>
      <h1 style={{ fontSize: 24, marginBottom: 6 }}>검수 건 {casePublicId.slice(0, 8)}</h1>
      <p style={{ color: "#6b7280", marginTop: 0 }}>{item.source} · {item.operation} · {item.priority} · {item.state}</p>
      <section style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, marginTop: 24, padding: 18 }}>
        <h2 style={{ fontSize: 15, marginTop: 0 }}>격리된 원문</h2>
        {evidenceError ? <p style={{ color: "#b91c1c" }}>{evidenceError}</p> : <p style={{ fontSize: 18, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{plaintext ?? "보존 기간이 지나 원문이 삭제되었습니다."}</p>}
      </section>
      <section style={{ marginTop: 24 }}><h2 style={{ fontSize: 15 }}>판정 근거</h2><p>{item.reason_codes.join(", ") || "없음"}</p><pre style={{ background: "#f3f4f6", borderRadius: 8, overflowX: "auto", padding: 12 }}>{JSON.stringify(item.provider_categories, null, 2)}</pre></section>
      {(item.state === "open" || item.state === "rejected") && plaintext ? (
        <form action={`/api/ops/moderation/${casePublicId}/decision`} method="post" style={{ borderTop: "1px solid #e5e7eb", marginTop: 28, paddingTop: 24 }}>
          <input name="csrf" type="hidden" value={session.csrf} />
          <label htmlFor="reason" style={{ display: "block", fontSize: 13, fontWeight: 700 }}>결정 사유 코드</label>
          <input defaultValue="operator_review" id="reason" maxLength={100} name="reasonCode" required style={{ boxSizing: "border-box", margin: "8px 0 12px", padding: 10, width: "100%" }} />
          <label htmlFor="note" style={{ display: "block", fontSize: 13, fontWeight: 700 }}>내부 메모</label>
          <textarea id="note" maxLength={1000} name="note" rows={3} style={{ boxSizing: "border-box", margin: "8px 0 16px", padding: 10, width: "100%" }} />
          <div style={{ display: "flex", gap: 10 }}>
            <button name="action" type="submit" value={item.state === "rejected" ? "restore" : "publish"} style={{ background: "#166534", border: 0, borderRadius: 8, color: "white", cursor: "pointer", fontWeight: 700, padding: "11px 16px" }}>{item.state === "rejected" ? "복구·공개" : "공개 승인"}</button>
            {item.state === "open" ? <button name="action" type="submit" value="reject" style={{ background: "#991b1b", border: 0, borderRadius: 8, color: "white", cursor: "pointer", fontWeight: 700, padding: "11px 16px" }}>게시 거절</button> : null}
          </div>
        </form>
      ) : null}
      {detail.decisions.length ? <section style={{ marginTop: 28 }}><h2 style={{ fontSize: 15 }}>결정 이력</h2>{detail.decisions.map((decision, index) => <p key={`${decision.created_at}-${index}`} style={{ color: "#4b5563", fontSize: 13 }}>{decision.created_at} · {decision.operator_id} · {decision.action} · {decision.reason_code}</p>)}</section> : null}
    </main>
  );
}
