import { CARD_WIDTH, CARD_HEIGHT } from "../generate";
import { checkmarkCardImgSrc } from "../checkmark-card-img";

type DeliveredVoterCardProps = {
  headerLine: string;
  content: string;
  dongName: string;
  createdAt: string;
  agreeCount: number;
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

export function DeliveredVoterCard({
  headerLine,
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
          flexDirection: "column",
          gap: "28px",
          width: "100%",
        }}
      >
        <div style={{ ...BANNER, display: "flex" }}>{headerLine}</div>

        <div
          style={{
            ...POST_CARD,
            boxShadow: "0 2px 8px rgba(17, 24, 39, 0.06)",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
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
              fontSize: "34px",
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
      </div>

      <div
        style={{
          alignItems: "flex-end",
          display: "flex",
          justifyContent: "space-between",
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
            alignItems: "flex-end",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
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
    </div>
  );
}
