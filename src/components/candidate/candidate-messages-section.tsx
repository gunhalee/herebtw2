"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  matchCandidateTier,
  type CandidateTier,
} from "../../lib/geo/administrative-code-lookup";
import { uiBrandYellow, uiColors, uiSpacing } from "../../lib/ui/tokens";

type CandidateMessage = {
  id: string;
  name: string;
  district: string;
  photoUrl: string | null;
  firstMessageContent: string;
  firstMessagePublicUuid: string;
};

type Props = {
  dongCode: string | null;
};

// ─── Cache ────────────────────────────────────────────────────────────────────

const CACHE_KEY = "herebtw.candidateMessages";

function readCachedCandidates(): CandidateMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CandidateMessage[]) : [];
  } catch {
    return [];
  }
}

function writeCachedCandidates(list: CandidateMessage[]) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(list));
  } catch {}
}

// ─── Single candidate card (mimics PostListItemCard, no actions) ──────────────

const PHOTO_WIDTH = 88; // px

function CandidateMessageCard({ candidate }: { candidate: CandidateMessage }) {
  const initials = candidate.name.slice(-1); // last char of Korean name

  return (
    <a
      href={`/v/${candidate.firstMessagePublicUuid}`}
      style={{ display: "block", textDecoration: "none" }}
    >
      <div
        style={{
          background: uiColors.surface,
          border: "1px solid rgba(17, 24, 39, 0.08)",
          borderRadius: "22px",
          boxShadow: "0 2px 8px rgba(17, 24, 39, 0.04)",
          boxSizing: "border-box",
          display: "flex",
          overflow: "hidden", // clips photo corners to match borderRadius
          width: "100%",
        }}
      >
        {/* ── Left: profile photo ──────────────────────────────────── */}
        <div
          style={{
            alignItems: "center",
            alignSelf: "stretch",
            background: "#e5e7eb",
            display: "flex",
            flexShrink: 0,
            justifyContent: "center",
            // width is determined by the image itself (aspect ratio × card height)
            // or falls back to PHOTO_WIDTH when there's no photo
            width: candidate.photoUrl ? undefined : `${PHOTO_WIDTH}px`,
          }}
        >
          {candidate.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={`${candidate.name} 후보`}
              src={candidate.photoUrl}
              style={{
                display: "block",
                // Fill card height; width follows natural aspect ratio
                height: "100%",
                maxWidth: "120px", // cap very wide images
                minWidth: "60px",  // floor for very narrow images
                width: "auto",
              }}
            />
          ) : (
            <span
              style={{
                color: "#6b7280",
                fontSize: "22px",
                fontWeight: 700,
              }}
            >
              {initials}
            </span>
          )}
        </div>

        {/* ── Right: meta + content ────────────────────────────────── */}
        <div
          style={{
            color: uiColors.textStrong,
            flex: 1,
            minWidth: 0,
            padding: `${uiSpacing.lg} ${uiSpacing.xl}`,
          }}
        >
          {/* Meta row */}
          <p
            style={{
              alignItems: "center",
              display: "flex",
              fontSize: "11px",
              gap: "6px",
              lineHeight: 1.35,
              margin: `0 0 ${uiSpacing.sm}`,
            }}
          >
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
              후보
            </span>
            <span style={{ color: uiColors.textStrong, fontWeight: 500 }}>
              {candidate.name}
            </span>
            <span style={{ color: uiColors.textMuted, fontWeight: 400 }}>
              · {candidate.district}
            </span>
          </p>

          {/* Content */}
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
      </div>
    </a>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

export function CandidateMessagesSection({ dongCode }: Props) {
  const [candidates, setCandidates] = useState<CandidateMessage[]>([]);
  const [othersOpen, setOthersOpen] = useState(false);

  useEffect(() => {
    // 1) Show cached candidates immediately
    const cached = readCachedCandidates();
    if (cached.length > 0) setCandidates(cached);

    // 2) Fetch fresh data
    let cancelled = false;
    fetch("/api/candidates/messages")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        const fetched: CandidateMessage[] = data?.data?.candidates ?? [];
        if (fetched.length > 0) {
          setCandidates(fetched);
          writeCachedCandidates(fetched);
        }
      })
      .catch((err) => {
        console.warn("[CandidateMessagesSection] fetch failed:", err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (candidates.length === 0) return null;

  // ── Tier classification ────────────────────────────────────────────────────
  const tiered = candidates.map((c) => ({
    candidate: c,
    tier: matchCandidateTier(c.district, dongCode) as CandidateTier,
  }));

  const primaryCandidates = tiered
    .filter((t) => t.tier === 1 || t.tier === 2)
    .map((t) => t.candidate);
  const otherCandidates = tiered
    .filter((t) => t.tier === 3)
    .map((t) => t.candidate);

  // If no tier1/2 match, show everyone directly (no collapse)
  const visibleCandidates =
    primaryCandidates.length > 0 ? primaryCandidates : candidates;
  const collapsedCandidates =
    primaryCandidates.length > 0 ? otherCandidates : [];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: uiSpacing.md,
        marginBottom: uiSpacing.sm,
        paddingBottom: uiSpacing.md,
        // full-bleed bottom border (outside the parent's horizontal padding)
        borderBottom: `1px solid ${uiColors.border}`,
        marginLeft: `-${uiSpacing.pageX}`,
        marginRight: `-${uiSpacing.pageX}`,
        paddingLeft: uiSpacing.pageX,
        paddingRight: uiSpacing.pageX,
      }}
    >
      {visibleCandidates.map((c) => (
        <CandidateMessageCard key={c.id} candidate={c} />
      ))}

      {/* Collapsible for other-region candidates */}
      {collapsedCandidates.length > 0 ? (
        <>
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
              padding: "2px 0",
            }}
          >
            {othersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            다른 지역 후보 {collapsedCandidates.length}명
          </button>

          {othersOpen
            ? collapsedCandidates.map((c) => (
                <CandidateMessageCard key={c.id} candidate={c} />
              ))
            : null}
        </>
      ) : null}
    </div>
  );
}
