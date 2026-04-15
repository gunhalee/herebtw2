"use client";

import { useLayoutEffect } from "react";
import { uiColors, uiSpacing } from "../../lib/ui/tokens";
import {
  type CandidateMessagesPayload,
  CandidateDistrictBadge,
  CandidateMessageCard,
} from "./candidate-messages-view";
import { useCandidateMessagesSection } from "./use-candidate-messages-section";

type CandidateMessagesSectionProps = {
  dongCode: string | null;
  initialData?: CandidateMessagesPayload | null;
  initialDongCode?: string | null;
  onSelectCandidate?: (candidateId: string) => void;
  onReady?: (dongCode: string) => void;
};

function CandidateMessagesToggleIcon({
  direction,
}: {
  direction: "down" | "up";
}) {
  const path =
    direction === "up"
      ? "M4.5 14.5L12 7l7.5 7.5"
      : "M4.5 9.5L12 17l7.5-7.5";

  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="14"
      viewBox="0 0 24 24"
      width="14"
    >
      <path
        d={path}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.25"
      />
    </svg>
  );
}

export function CandidateMessagesSection({
  dongCode,
  initialData = null,
  initialDongCode = null,
  onSelectCandidate,
  onReady,
}: CandidateMessagesSectionProps) {
  const {
    candidates,
    collapsedCandidates,
    isResolved,
    othersOpen,
    primaryCandidates,
    setOthersOpen,
    userDistricts,
    visibleCandidates,
  } = useCandidateMessagesSection(dongCode, initialData, initialDongCode);

  useLayoutEffect(() => {
    if (!dongCode || !isResolved || !onReady) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      onReady(dongCode);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [dongCode, isResolved, onReady]);

  if (candidates.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        borderBottom: `1px solid ${uiColors.border}`,
        display: "flex",
        flexDirection: "column",
        gap: uiSpacing.md,
        marginBottom: uiSpacing.sm,
        marginLeft: `-${uiSpacing.pageX}`,
        marginRight: `-${uiSpacing.pageX}`,
        paddingBottom: uiSpacing.md,
        paddingLeft: uiSpacing.pageX,
        paddingRight: uiSpacing.pageX,
      }}
    >
      {userDistricts &&
      (userDistricts.localCouncilDistrict || userDistricts.metroCouncilDistrict) &&
      primaryCandidates.length > 0 ? (
        <div
          style={{
            alignItems: "center",
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
          }}
        >
          <span
            style={{
              color: uiColors.textMuted,
              fontSize: "11px",
              fontWeight: 600,
              marginRight: "2px",
            }}
          >
            우리 동네 후보
          </span>
          {userDistricts.localCouncilDistrict ? (
            <CandidateDistrictBadge
              label={userDistricts.localCouncilDistrict}
              tier="local"
            />
          ) : null}
          {userDistricts.metroCouncilDistrict ? (
            <CandidateDistrictBadge
              label={userDistricts.metroCouncilDistrict}
              tier="metro"
            />
          ) : null}
        </div>
      ) : null}

      {visibleCandidates.map((candidate) => (
        <CandidateMessageCard
          key={candidate.id}
          candidate={candidate}
          onSelect={onSelectCandidate}
        />
      ))}

      {collapsedCandidates.length > 0 ? (
        <>
          <button
            onClick={() => setOthersOpen((current) => !current)}
            style={{
              alignItems: "center",
              appearance: "none",
              background: "transparent",
              border: "none",
              color: uiColors.textMuted,
              cursor: "pointer",
              display: "flex",
              fontSize: "12px",
              fontWeight: 600,
              gap: "4px",
              padding: "2px 0",
            }}
            type="button"
          >
            <CandidateMessagesToggleIcon direction={othersOpen ? "up" : "down"} />
            다른 후보 더보기
          </button>

          {othersOpen
            ? collapsedCandidates.map((candidate) => (
                <CandidateMessageCard
                  key={candidate.id}
                  candidate={candidate}
                  onSelect={onSelectCandidate}
                />
              ))
            : null}
        </>
      ) : null}
    </div>
  );
}
