"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  matchCandidateTier,
  getSigunguName,
  getSidoName,
  type CandidateTier,
} from "../../lib/geo/administrative-code-lookup";
import { uiColors, uiRadius, uiSpacing, uiTypography } from "../../lib/ui/tokens";

type CandidateMessage = {
  id: string;
  name: string;
  district: string;
  firstMessageContent: string;
  firstMessagePublicUuid: string;
};

type Props = {
  dongCode: string | null;
};

function CandidateCard({ candidate }: { candidate: CandidateMessage }) {
  return (
    <a
      href={`/v/${candidate.firstMessagePublicUuid}`}
      style={{
        background: "#ffffff",
        border: `1px solid ${uiColors.border}`,
        borderRadius: uiRadius.md,
        display: "block",
        flexShrink: 0,
        padding: `${uiSpacing.md} ${uiSpacing.lg}`,
        textDecoration: "none",
        width: "220px",
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: "6px",
          marginBottom: "6px",
        }}
      >
        <span
          style={{
            background: "#ebe8ff",
            borderRadius: "6px",
            color: "#5b57d6",
            fontSize: "10px",
            fontWeight: 700,
            padding: "2px 6px",
          }}
        >
          후보
        </span>
        <span
          style={{
            color: uiColors.textStrong,
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          {candidate.name}
        </span>
        <span
          style={{
            color: uiColors.textMuted,
            fontSize: "11px",
          }}
        >
          {candidate.district}
        </span>
      </div>
      <p
        style={{
          color: uiColors.textBody,
          fontSize: "13px",
          lineHeight: 1.5,
          margin: 0,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 2,
        }}
      >
        "{candidate.firstMessageContent}"
      </p>
    </a>
  );
}

function CandidateRow({
  label,
  candidates,
}: {
  label: string;
  candidates: CandidateMessage[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      <p
        style={{
          color: uiColors.textMuted,
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.04em",
          margin: `0 0 6px ${uiSpacing.pageX}`,
        }}
      >
        {label}
      </p>
      <div
        ref={scrollRef}
        style={{
          display: "flex",
          gap: uiSpacing.md,
          overflowX: "auto",
          padding: `0 ${uiSpacing.pageX}`,
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {candidates.map((c) => (
          <CandidateCard key={c.id} candidate={c} />
        ))}
      </div>
    </div>
  );
}

const CACHE_KEY = "herebtw.candidateMessages";

function readCachedCandidates(): CandidateMessage[] {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CandidateMessage[]) : [];
  } catch {
    return [];
  }
}

function writeCachedCandidates(candidates: CandidateMessage[]) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(candidates));
  } catch {
    // ignore
  }
}

export function CandidateMessagesSection({ dongCode }: Props) {
  const [candidates, setCandidates] = useState<CandidateMessage[]>(() =>
    readCachedCandidates(),
  );
  const [othersOpen, setOthersOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/candidates/messages")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          const fetched: CandidateMessage[] = data?.data?.candidates ?? [];
          if (fetched.length > 0) {
            setCandidates(fetched);
            writeCachedCandidates(fetched);
          }
        }
      })
      .catch(() => {
        // silently ignore — cached data stays visible
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (candidates.length === 0) return null;

  // Categorise by tier
  const tiered = candidates.map((c) => ({
    candidate: c,
    tier: matchCandidateTier(c.district, dongCode) as CandidateTier,
  }));

  const tier1 = tiered.filter((t) => t.tier === 1).map((t) => t.candidate);
  const tier2 = tiered.filter((t) => t.tier === 2).map((t) => t.candidate);
  const tier3 = tiered.filter((t) => t.tier === 3).map((t) => t.candidate);

  const primaryCandidates = [...tier1, ...tier2];
  const hasOthers = tier3.length > 0;
  const hasNearby = primaryCandidates.length > 0;

  // Build label for tier 1 section
  const sigunguName = getSigunguName(dongCode);
  const sidoName = getSidoName(dongCode);
  const nearbyLabel = sigunguName
    ? `${sigunguName} · ${sidoName ?? ""} 후보`
    : sidoName
      ? `${sidoName} 후보`
      : "내 지역 후보";

  // If no location, lump all into "others"
  if (!dongCode) {
    return (
      <section
        style={{
          borderBottom: `1px solid ${uiColors.border}`,
          paddingBottom: uiSpacing.lg,
          paddingTop: uiSpacing.lg,
        }}
      >
        <SectionHeader />
        <CandidateRow label="전체 후보" candidates={candidates} />
      </section>
    );
  }

  return (
    <section
      style={{
        borderBottom: `1px solid ${uiColors.border}`,
        display: "flex",
        flexDirection: "column",
        gap: uiSpacing.md,
        paddingBottom: uiSpacing.lg,
        paddingTop: uiSpacing.lg,
      }}
    >
      <SectionHeader />

      {hasNearby ? (
        <CandidateRow label={nearbyLabel} candidates={primaryCandidates} />
      ) : null}

      {hasOthers ? (
        <div>
          <button
            type="button"
            onClick={() => setOthersOpen((v) => !v)}
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
              marginLeft: uiSpacing.pageX,
              padding: "4px 0",
            }}
          >
            {othersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            다른 지역 후보 {tier3.length}명
          </button>

          {othersOpen ? (
            <div style={{ marginTop: "6px" }}>
              <CandidateRow label="다른 지역" candidates={tier3} />
            </div>
          ) : null}
        </div>
      ) : null}

      {!hasNearby && !hasOthers ? null : null}
    </section>
  );
}

function SectionHeader() {
  return (
    <p
      style={{
        color: uiColors.textStrong,
        fontSize: uiTypography.title.fontSize,
        fontWeight: uiTypography.title.fontWeight,
        margin: `0 0 2px ${uiSpacing.pageX}`,
      }}
    >
      후보자 한마디
    </p>
  );
}
