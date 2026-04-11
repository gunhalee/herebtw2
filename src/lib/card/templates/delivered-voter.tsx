import { CARD_WIDTH, CARD_HEIGHT } from "../generate";

type DeliveredVoterCardProps = {
  content: string;
  dongName: string;
  createdAt: string;
  agreeCount: number;
};

export function DeliveredVoterCard({
  content,
  dongName,
  createdAt,
  agreeCount,
}: DeliveredVoterCardProps) {
  const date = new Date(createdAt);
  const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;

  return (
    <div
      style={{
        background: "linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%)",
        display: "flex",
        flexDirection: "column",
        height: CARD_HEIGHT,
        justifyContent: "space-between",
        padding: "80px",
        width: CARD_WIDTH,
      }}
    >
      {/* Top: Badge */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div
          style={{
            alignItems: "center",
            background: "#2563eb",
            borderRadius: "40px",
            color: "#ffffff",
            display: "flex",
            fontSize: "28px",
            fontWeight: 700,
            gap: "12px",
            padding: "12px 28px",
            width: "fit-content",
          }}
        >
          ✉️ 전달됨
        </div>
        <div
          style={{
            color: "#64748b",
            display: "flex",
            fontSize: "28px",
          }}
        >
          {dongName} · {dateStr}
        </div>
      </div>

      {/* Center: Content */}
      <div
        style={{
          color: "#0f172a",
          display: "flex",
          fontSize: "52px",
          fontWeight: 700,
          lineHeight: 1.5,
          textAlign: "center",
          justifyContent: "center",
          padding: "40px 0",
          wordBreak: "keep-all",
        }}
      >
        &ldquo;{content}&rdquo;
      </div>

      {/* Bottom: Meta */}
      <div
        style={{
          alignItems: "flex-end",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div
            style={{
              color: "#64748b",
              display: "flex",
              fontSize: "24px",
            }}
          >
            공감 {agreeCount}명
          </div>
        </div>
        <div
          style={{
            color: "#94a3b8",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "4px",
          }}
        >
          <div style={{ display: "flex", fontSize: "32px", fontWeight: 700 }}>
            여기 근데
          </div>
          <div style={{ display: "flex", fontSize: "20px" }}>
            herebtw.vercel.app
          </div>
        </div>
      </div>
    </div>
  );
}
