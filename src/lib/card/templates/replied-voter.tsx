import { normalizeAdministrativeDongName } from "../../geo/format-administrative-area";
import { formatRelativeTime } from "../../utils/datetime";
import { MAIN_PAGE_FONT_FAMILY } from "../font-family";
import { CARD_WIDTH, CARD_HEIGHT } from "../generate";

type RepliedVoterCardProps = {
  headerLine: string;
  content: string;
  dongName: string;
  createdAt: string;
  agreeCount: number;
  replyCandidateName: string;
  replyContent: string;
  replyIsPromise: boolean;
  replyCreatedAt?: string | null;
};

function CardHeader({ dongName }: { dongName: string }) {
  const shortDongName =
    normalizeAdministrativeDongName(dongName).trim() || dongName.trim();

  return (
    <div
      style={{
        alignItems: "center",
        background: "#ffed00",
        display: "flex",
        height: "206px",
        justifyContent: "center",
        padding: "0 26px",
        width: "100%",
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: "24px",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <span
          style={{
            color: "#111827",
            display: "flex",
            fontSize: "62px",
            fontWeight: 700,
            letterSpacing: "-0.025em",
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          후보님 여기
        </span>
        <span
          style={{
            alignItems: "center",
            background: "#f3f4f6",
            borderRadius: "999px",
            color: "#111827",
            display: "flex",
            fontSize: "62px",
            fontWeight: 700,
            height: "108px",
            justifyContent: "center",
            lineHeight: 1,
            padding: "0 56px",
            whiteSpace: "nowrap",
          }}
        >
          {shortDongName}
        </span>
        <span
          style={{
            color: "#111827",
            display: "flex",
            fontSize: "62px",
            fontWeight: 700,
            letterSpacing: "-0.025em",
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          인데요
        </span>
      </div>
    </div>
  );
}

type BubbleProps = {
  content: string;
  primaryLabel: string;
  timeLabel: string;
};

function SpeechBubble({ content, primaryLabel, timeLabel }: BubbleProps) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "6px solid #f4dc73",
        borderRadius: "54px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        padding: "42px 54px",
        width: "100%",
      }}
    >
      <div
        style={{
          color: "#9ca3af",
          display: "flex",
          fontSize: "40px",
          fontWeight: 500,
          letterSpacing: "-0.01em",
          lineHeight: 1.25,
        }}
      >
        <span style={{ color: "#111827", fontWeight: 700 }}>{primaryLabel}</span>
        <span>{` · ${timeLabel}`}</span>
      </div>

      <div
        style={{
          color: "#111827",
          display: "flex",
          fontSize: "58px",
          fontWeight: 600,
          letterSpacing: "-0.02em",
          lineHeight: 1.32,
          wordBreak: "keep-all",
        }}
      >
        {content}
      </div>
    </div>
  );
}

function CardFooter() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        paddingBottom: "32px",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "16px",
          textAlign: "right",
        }}
      >
        <span
          style={{
            color: "#111827",
            display: "block",
            fontSize: "62px",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            width: "fit-content",
          }}
        >
          여기 근데
        </span>
        <span
          style={{
            color: "#9ca3af",
            display: "block",
            fontSize: "62px",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            width: "fit-content",
          }}
        >
          한마디 할게요
        </span>
      </div>
    </div>
  );
}

export function RepliedVoterCard({
  headerLine: _headerLine,
  content,
  dongName,
  createdAt,
  agreeCount: _agreeCount,
  replyCandidateName,
  replyContent,
  replyIsPromise: _replyIsPromise,
  replyCreatedAt,
}: RepliedVoterCardProps) {
  return (
    <div
      style={{
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        fontFamily: MAIN_PAGE_FONT_FAMILY,
        height: CARD_HEIGHT,
        width: CARD_WIDTH,
      }}
    >
      <CardHeader dongName={dongName} />

      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px 52px 20px",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "30px",
          }}
        >
          <SpeechBubble
            content={content}
            primaryLabel={dongName}
            timeLabel={formatRelativeTime(createdAt)}
          />

          <SpeechBubble
            content={replyContent}
            primaryLabel={`${replyCandidateName} 후보 답글`}
            timeLabel={formatRelativeTime(replyCreatedAt ?? createdAt)}
          />
        </div>

        <CardFooter />
      </div>
    </div>
  );
}
