"use client";
import { ChevronRight } from "lucide-react";
import { uiBrandYellow, uiColors, uiSpacing } from "../../lib/ui/tokens";
import type {
  CandidateMessage,
  CandidateMessagesPayload,
} from "../../lib/candidates/messages";

const PHOTO_FALLBACK_WIDTH = 72;

export function CandidateDistrictBadge({
  label,
  tier,
}: {
  label: string;
  tier: "local" | "metro";
}) {
  const isLocal = tier === "local";

  return (
    <span
      style={{
        background: isLocal ? "#f0fdf4" : "#eff6ff",
        border: `1px solid ${isLocal ? "#bbf7d0" : "#bfdbfe"}`,
        borderRadius: "999px",
        color: isLocal ? "#15803d" : "#1d4ed8",
        fontSize: "11px",
        fontWeight: 700,
        padding: "3px 10px",
      }}
    >
      {isLocal ? "기초의회" : "광역의회"} {label}
    </span>
  );
}

export function CandidateMessageCard({
  candidate,
  onSelect,
}: {
  candidate: CandidateMessage;
  onSelect?: (candidateId: string) => void;
}) {
  const interactive = Boolean(onSelect);
  const handleSelect = () => onSelect?.(candidate.id);
  const initials = candidate.name.slice(-1);
  const districtLabel =
    candidate.localCouncilDistrict ??
    candidate.metroCouncilDistrict ??
    candidate.district;
  const councilBadge =
    candidate.councilType ??
    (candidate.localCouncilDistrict
      ? "기초의회"
      : candidate.metroCouncilDistrict
        ? "광역의회"
        : null);

  const cardContent = (
    <div
      style={{
        background: uiColors.surface,
        border: "1px solid rgba(17, 24, 39, 0.08)",
        borderRadius: "22px",
        boxShadow: "0 2px 8px rgba(17, 24, 39, 0.04)",
        boxSizing: "border-box",
        display: "flex",
        overflow: "hidden",
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          background: uiBrandYellow.borderWarm,
          bottom: 0,
          left: 0,
          position: "absolute",
          top: 0,
          width: "4px",
        }}
      />
      {candidate.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={`${candidate.name} 후보`}
          decoding="async"
          loading="lazy"
          src={candidate.photoUrl}
          style={{
            alignSelf: "flex-end",
            display: "block",
            flexShrink: 0,
            height: "76px",
            width: "auto",
          }}
        />
      ) : (
        <div
          style={{
            alignItems: "center",
            alignSelf: "flex-end",
            background: "#e5e7eb",
            borderRadius: "50%",
            display: "flex",
            flexShrink: 0,
            height: `${PHOTO_FALLBACK_WIDTH}px`,
            justifyContent: "center",
            margin: "0 8px 0",
            width: `${PHOTO_FALLBACK_WIDTH}px`,
          }}
        >
          <span style={{ color: "#6b7280", fontSize: "22px", fontWeight: 700 }}>
            {initials}
          </span>
        </div>
      )}

      <div
        style={{
          color: uiColors.textStrong,
          flex: 1,
          minWidth: 0,
          padding: `${uiSpacing.lg} ${uiSpacing.xl}`,
        }}
      >
        <p
          style={{
            alignItems: "center",
            display: "flex",
            flexWrap: "wrap",
            fontSize: "11px",
            gap: "6px",
            lineHeight: 1.35,
            margin: `0 0 ${uiSpacing.sm}`,
          }}
        >
          <span style={{ color: uiColors.textStrong, fontWeight: 500 }}>
            {candidate.name}
          </span>
          <span style={{ color: uiColors.textStrong, fontWeight: 500 }}>
            · {districtLabel}
          </span>
          <span
            style={{
              background: uiBrandYellow.surfaceWarm,
              border: `1px solid ${uiBrandYellow.borderWarm}`,
              borderRadius: "999px",
              color: uiColors.textStrong,
              fontSize: "10px",
              fontWeight: 700,
              padding: "2px 8px",
            }}
          >
            {councilBadge ? `${councilBadge} 후보` : "후보"}
          </span>
        </p>

        <p
          style={{
            color: uiColors.textStrong,
            fontSize: "15px",
            fontWeight: 500,
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {candidate.firstMessageContent}
        </p>
      </div>

      {interactive ? (
        <div
          aria-hidden="true"
          style={{
            alignItems: "center",
            color: uiColors.textMuted,
            display: "flex",
            flexShrink: 0,
            gap: "4px",
            justifyContent: "center",
            padding: `0 ${uiSpacing.lg} 0 0`,
          }}
        >
          <span
            style={{
              color: uiColors.textMuted,
              fontSize: "13px",
              fontWeight: 500,
              lineHeight: 1,
            }}
          >
            모아보기
          </span>
          <ChevronRight size={26} strokeWidth={2.25} />
        </div>
      ) : null}
    </div>
  );

  if (!interactive) {
    return cardContent;
  }

  return (
    <button
      onClick={handleSelect}
      style={{
        appearance: "none",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        display: "block",
        padding: 0,
        textAlign: "left",
        width: "100%",
      }}
      type="button"
    >
      {cardContent}
    </button>
  );
}

export type { CandidateMessagesPayload };
