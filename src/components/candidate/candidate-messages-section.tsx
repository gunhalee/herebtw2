"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { uiBrandYellow, uiColors, uiSpacing } from "../../lib/ui/tokens";

type CandidateMatchType = "local" | "metro" | "other";

type CandidateMessage = {
  id: string;
  name: string;
  district: string;
  photoUrl: string | null;
  firstMessageContent: string;
  firstMessagePublicUuid: string;
  metroCouncilDistrict: string | null;
  localCouncilDistrict: string | null;
  councilType: string | null;
  matchType: CandidateMatchType;
};

type UserDistricts = {
  metroCouncilDistrict: string | null;
  localCouncilDistrict: string | null;
} | null;

type Props = {
  dongCode: string | null;
};

// ─── Cache ────────────────────────────────────────────────────────────────────

const CACHE_KEY = "herebtw.candidateMessages.v2";

type CachedPayload = {
  candidates: CandidateMessage[];
  userDistricts: UserDistricts;
  dongCode: string | null;
};

function readCache(dongCode: string | null): CachedPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedPayload;
    // 동코드가 바뀌면 캐시 무효
    if (parsed.dongCode !== dongCode) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(payload: CachedPayload) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {}
}

// ─── Single candidate card ────────────────────────────────────────────────────

const PHOTO_FALLBACK_WIDTH = 72;

function CandidateMessageCard({ candidate }: { candidate: CandidateMessage }) {
  const initials = candidate.name.slice(-1);

  // 표시할 지역명: 선거구명 우선, 없으면 자유 텍스트 district
  const districtLabel =
    candidate.localCouncilDistrict ?? candidate.metroCouncilDistrict ?? candidate.district;

  // 의회 구분 배지: council_type이 있으면 그대로, 없으면 선거구로 추정
  const councilBadge =
    candidate.councilType ??
    (candidate.localCouncilDistrict
      ? "구·시·군의회"
      : candidate.metroCouncilDistrict
        ? "시도의회"
        : null);

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
          overflow: "hidden",
          width: "100%",
        }}
      >
        {/* ── 프로필 사진 ──────────────────────────────────── */}
        {candidate.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={`${candidate.name} 후보`}
            src={candidate.photoUrl}
            style={{
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
              alignSelf: "stretch",
              background: "#e5e7eb",
              display: "flex",
              flexShrink: 0,
              justifyContent: "center",
              width: `${PHOTO_FALLBACK_WIDTH}px`,
            }}
          >
            <span style={{ color: "#6b7280", fontSize: "22px", fontWeight: 700 }}>
              {initials}
            </span>
          </div>
        )}

        {/* ── 이름 + 선거구 + 한마디 ────────────────────────── */}
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
              · {districtLabel}
            </span>
            {councilBadge ? (
              <span
                style={{
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: "999px",
                  color: "#1d4ed8",
                  fontSize: "10px",
                  fontWeight: 600,
                  padding: "2px 7px",
                }}
              >
                {councilBadge}
              </span>
            ) : null}
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
      </div>
    </a>
  );
}

// ─── 선거구 레이블 헤더 ──────────────────────────────────────────────────────

function DistrictBadge({ label, tier }: { label: string; tier: "local" | "metro" }) {
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
      {isLocal ? "구·시·군의회" : "시·도의회"} {label}
    </span>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

export function CandidateMessagesSection({ dongCode }: Props) {
  const [candidates, setCandidates] = useState<CandidateMessage[]>([]);
  const [userDistricts, setUserDistricts] = useState<UserDistricts>(null);
  const [othersOpen, setOthersOpen] = useState(false);

  useEffect(() => {
    // 캐시 즉시 표시
    const cached = readCache(dongCode);
    if (cached) {
      setCandidates(cached.candidates);
      setUserDistricts(cached.userDistricts);
    }

    // 최신 데이터 패치
    let cancelled = false;
    const url = dongCode
      ? `/api/candidates/messages?dongCode=${encodeURIComponent(dongCode)}`
      : "/api/candidates/messages";

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        const fetched: CandidateMessage[] = data?.data?.candidates ?? [];
        const districts: UserDistricts = data?.data?.userDistricts ?? null;
        if (fetched.length > 0) {
          setCandidates(fetched);
          setUserDistricts(districts);
          writeCache({ candidates: fetched, userDistricts: districts, dongCode });
        }
      })
      .catch((err) => {
        console.warn("[CandidateMessagesSection] fetch failed:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [dongCode]);

  if (candidates.length === 0) return null;

  // 선거구 매칭 후보 / 기타 분리
  const primaryCandidates = candidates.filter(
    (c) => c.matchType === "local" || c.matchType === "metro",
  );
  const otherCandidates = candidates.filter((c) => c.matchType === "other");

  const visibleCandidates = primaryCandidates.length > 0 ? primaryCandidates : candidates;
  const collapsedCandidates = primaryCandidates.length > 0 ? otherCandidates : [];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: uiSpacing.md,
        marginBottom: uiSpacing.sm,
        paddingBottom: uiSpacing.md,
        borderBottom: `1px solid ${uiColors.border}`,
        marginLeft: `-${uiSpacing.pageX}`,
        marginRight: `-${uiSpacing.pageX}`,
        paddingLeft: uiSpacing.pageX,
        paddingRight: uiSpacing.pageX,
      }}
    >
      {/* 선거구 정보 헤더 */}
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
            내 선거구 후보
          </span>
          {userDistricts.localCouncilDistrict ? (
            <DistrictBadge label={userDistricts.localCouncilDistrict} tier="local" />
          ) : null}
          {userDistricts.metroCouncilDistrict ? (
            <DistrictBadge label={userDistricts.metroCouncilDistrict} tier="metro" />
          ) : null}
        </div>
      ) : null}

      {visibleCandidates.map((c) => (
        <CandidateMessageCard key={c.id} candidate={c} />
      ))}

      {/* 다른 지역 후보 접기/펼치기 */}
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
