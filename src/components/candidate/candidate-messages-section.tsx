"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { uiColors, uiSpacing } from "../../lib/ui/tokens";
import {
  CandidateDistrictBadge,
  CandidateMessageCard,
} from "./candidate-messages-view";
import { useCandidateMessagesSection } from "./use-candidate-messages-section";

type CandidateMessagesSectionProps = {
  dongCode: string | null;
};

export function CandidateMessagesSection({
  dongCode,
}: CandidateMessagesSectionProps) {
  const {
    candidates,
    collapsedCandidates,
    othersOpen,
    primaryCandidates,
    setOthersOpen,
    userDistricts,
    visibleCandidates,
  } = useCandidateMessagesSection(dongCode);

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
            ?곕━ ?좉굅援??꾨낫
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
        <CandidateMessageCard key={candidate.id} candidate={candidate} />
      ))}

      {collapsedCandidates.length > 0 ? (
        <>
          <button
            type="button"
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
          >
            {othersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            ?ㅻⅨ 吏???꾨낫 {collapsedCandidates.length}紐?
          </button>

          {othersOpen
            ? collapsedCandidates.map((candidate) => (
                <CandidateMessageCard key={candidate.id} candidate={candidate} />
              ))
            : null}
        </>
      ) : null}
    </div>
  );
}
