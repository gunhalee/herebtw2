import { CARD_WIDTH, CARD_HEIGHT } from "../generate";
import { checkmarkCardImgSrc } from "../checkmark-card-img";

type RepliedVoterCardProps = {
  headerLine: string;
  content: string;
  dongName: string;
  createdAt: string;
  agreeCount: number;
  replyCandidateName: string;
  replyContent: string;
  replyIsPromise: boolean;
};

const POST_CARD = {
  background: "#ffffff",
  border: "3px solid #fde68a",
  borderRadius: "22px",
  padding: "28px 32px",
} as const;

const BANNER = {
  background: "linear-gradient(180deg, #fff89a 0%, #ffed00 100%)",
  border: "1px solid #e7dccd",
  borderRadius: "20px",
  color: "#111827",
  fontSize: "36px",
  fontWeight: 700,
  lineHeight: 1.35,
  padding: "28px 36px",
  width: "100%",
} as const;

export function RepliedVoterCard({
  headerLine,
  content,
  dongName,
  createdAt,
  agreeCount,
  replyCandidateName,
  replyContent,
  replyIsPromise,
}: RepliedVoterCardProps) {
  const date = new Date(createdAt);
  const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;

  return (
    <div
      style={{
        background: "#f9fafb",
        display: "flex",
        flexDirection: "column",
        height: CARD_HEIGHT,
        justifyContent: "space-between",
        padding: "56px 64px 72px",
        width: CARD_WIDTH,
      }}
    >
      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          gap: "24px",
          minHeight: 0,
          width: "100%",
        }}
      >
        <div style={{ ...BANNER, display: "flex" }}>{headerLine}</div>

        <div
          style={{
            alignItems: "center",
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            borderRadius: "999px",
            color: "#059669",
            display: "flex",
            fontSize: "24px",
            fontWeight: 600,
            gap: "10px",
            padding: "12px 24px",
            width: "fit-content",
          }}
        >
          답변이 도착했습니다
        </div>

        <div
          style={{
            ...POST_CARD,
            boxShadow: "0 2px 8px rgba(17, 24, 39, 0.06)",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <div
            style={{
              color: "#8f96a3",
              display: "flex",
              fontSize: "22px",
              fontWeight: 400,
              lineHeight: 1.35,
            }}
          >
            <span style={{ color: "#111827", fontWeight: 500 }}>{dongName}</span>
            <span>{` · ${dateStr}`}</span>
          </div>

          <div
            style={{
              color: "#111827",
              display: "flex",
              fontSize: "32px",
              fontWeight: 500,
              lineHeight: 1.5,
              wordBreak: "keep-all",
            }}
          >
            {content}
          </div>

          {agreeCount > 0 ? (
            <div
              style={{
                alignItems: "center",
                alignSelf: "flex-start",
                background: "rgba(255,255,255,0.96)",
                border: "1px solid #e5e7eb",
                borderRadius: "999px",
                boxShadow: "0 8px 18px rgba(17, 24, 39, 0.12)",
                display: "flex",
                gap: "10px",
                padding: "10px 18px",
              }}
            >
              <img alt="" height={28} src={checkmarkCardImgSrc} width={28} />
              <span
                style={{
                  color: "#111827",
                  fontSize: "24px",
                  fontWeight: 600,
                  lineHeight: 1,
                }}
              >
                {agreeCount}
              </span>
            </div>
          ) : null}
        </div>

        <div
          style={{
            background: "#f0fdf4",
            borderLeft: "4px solid #059669",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            padding: "24px 28px",
          }}
        >
          <div style={{ alignItems: "center", display: "flex", gap: "12px" }}>
            <span
              style={{
                color: "#059669",
                display: "flex",
                fontSize: "26px",
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
                  fontSize: "20px",
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
              color: "#374151",
              display: "flex",
              fontSize: "30px",
              lineHeight: 1.5,
              wordBreak: "keep-all",
            }}
          >
            {replyContent}
          </div>
        </div>
      </div>

      <div
        style={{
          alignItems: "flex-end",
          display: "flex",
          justifyContent: "space-between",
          marginTop: "24px",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div
            style={{
              color: "#111827",
              display: "flex",
              fontSize: "36px",
              fontWeight: 700,
            }}
          >
            여기 근데
          </div>
          <div
            style={{
              color: "#374151",
              display: "flex",
              fontSize: "28px",
              fontWeight: 600,
            }}
          >
            한마디 할게요
          </div>
        </div>
        <div
          style={{
            color: "#64748b",
            display: "flex",
            fontSize: "26px",
            fontWeight: 500,
          }}
        >
          herebtw.vercel.app
        </div>
      </div>
    </div>
  );
}
