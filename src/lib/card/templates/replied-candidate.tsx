import { CARD_WIDTH, CARD_HEIGHT } from "../generate";

type RepliedCandidateCardProps = {
  content: string;
  dongName: string;
  replyCandidateName: string;
  replyContent: string;
  replyIsPromise: boolean;
  agreeCount: number;
};

export function RepliedCandidateCard({
  content,
  dongName,
  replyCandidateName,
  replyContent,
  replyIsPromise,
  agreeCount,
}: RepliedCandidateCardProps) {
  return (
    <div
      style={{
        background: "linear-gradient(145deg, #eff6ff 0%, #dbeafe 100%)",
        display: "flex",
        flexDirection: "column",
        height: CARD_HEIGHT,
        justifyContent: "space-between",
        padding: "80px",
        width: CARD_WIDTH,
      }}
    >
      {/* Top */}
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
          💬 {replyCandidateName} 후보가 답했습니다
        </div>
        <div style={{ color: "#64748b", display: "flex", fontSize: "28px" }}>
          {dongName}
        </div>
      </div>

      {/* Content */}
      <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
        <div
          style={{
            background: "rgba(255,255,255,0.6)",
            borderRadius: "24px",
            color: "#374151",
            display: "flex",
            fontSize: "36px",
            lineHeight: 1.5,
            padding: "28px 32px",
            wordBreak: "keep-all",
          }}
        >
          &ldquo;{content}&rdquo;
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ alignItems: "center", display: "flex", gap: "12px" }}>
            <span
              style={{
                color: "#2563eb",
                display: "flex",
                fontSize: "32px",
                fontWeight: 700,
              }}
            >
              {replyCandidateName} 후보
            </span>
            {replyIsPromise ? (
              <span
                style={{
                  background: "#fbbf24",
                  borderRadius: "8px",
                  color: "#78350f",
                  display: "flex",
                  fontSize: "22px",
                  fontWeight: 700,
                  padding: "4px 12px",
                }}
              >
                약속합니다
              </span>
            ) : null}
          </div>
          <div
            style={{
              color: "#0f172a",
              display: "flex",
              fontSize: "44px",
              fontWeight: 700,
              lineHeight: 1.5,
              wordBreak: "keep-all",
            }}
          >
            &ldquo;{replyContent}&rdquo;
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div
        style={{
          alignItems: "flex-end",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div style={{ color: "#64748b", display: "flex", fontSize: "24px" }}>
          공감 {agreeCount}명
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
