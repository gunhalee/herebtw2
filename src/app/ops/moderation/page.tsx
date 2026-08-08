import Link from "next/link";
import { redirect } from "next/navigation";
import { getOpsSession } from "../../../lib/moderation/ops-auth";
import { listModerationCases } from "../../../lib/moderation/repository";

export const dynamic = "force-dynamic";

export default async function ModerationQueuePage({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  if (!(await getOpsSession())) redirect("/ops/login?next=/ops/moderation");
  const requestedState = (await searchParams).state;
  const state = requestedState === "published" || requestedState === "rejected" ? requestedState : "open";
  const cases = await listModerationCases(state);
  return (
    <main style={{ margin: "0 auto", maxWidth: 980, padding: "36px 20px 80px" }}>
      <h1 style={{ fontSize: 26, marginBottom: 8 }}>콘텐츠 검수</h1>
      <p style={{ color: "#6b7280", marginTop: 0 }}>웹 화면이 최종 기록입니다. Telegram은 알림과 진입 링크만 제공합니다.</p>
      <nav style={{ display: "flex", gap: 8, margin: "24px 0" }}>
        {["open", "published", "rejected"].map((item) => <Link key={item} href={`/ops/moderation?state=${item}`} style={{ background: state === item ? "#111827" : "#f3f4f6", borderRadius: 999, color: state === item ? "white" : "#374151", padding: "8px 14px", textDecoration: "none" }}>{item}</Link>)}
      </nav>
      <div style={{ display: "grid", gap: 10 }}>
        {cases.length === 0 ? <p style={{ color: "#6b7280" }}>해당 상태의 검수 건이 없습니다.</p> : cases.map((item) => (
          <Link href={`/ops/moderation/${item.public_id}`} key={item.id} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, color: "inherit", display: "grid", gap: 8, padding: 16, textDecoration: "none" }}>
            <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}><strong>{item.priority.toUpperCase()} · {item.source}</strong><time style={{ color: "#6b7280", fontSize: 13 }}>{new Date(item.opened_at).toLocaleString("ko-KR")}</time></div>
            <span style={{ color: "#4b5563", fontSize: 14 }}>{item.reason_codes.join(", ") || "규칙 근거 없음"}</span>
            <span style={{ color: "#6b7280", fontSize: 12 }}>Google: {item.provider_status} · {item.operation}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
