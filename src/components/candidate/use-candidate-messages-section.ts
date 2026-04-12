"use client";

import { useEffect, useState } from "react";
import type {
  CandidateMessage,
  UserDistricts,
} from "../../lib/candidates/messages";
import { fetchCandidateMessages } from "./candidate-messages-api";

const CACHE_KEY = "herebtw.candidateMessages.v3";

type CachedPayload = {
  candidates: CandidateMessage[];
  dongCode: string;
  userDistricts: UserDistricts;
};

function readCache(dongCode: string | null): CachedPayload | null {
  if (typeof window === "undefined" || !dongCode) {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CachedPayload;
    return parsed.dongCode === dongCode ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(payload: CachedPayload) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore cache write errors.
  }
}

export function useCandidateMessagesSection(dongCode: string | null) {
  const [candidates, setCandidates] = useState<CandidateMessage[]>([]);
  const [userDistricts, setUserDistricts] = useState<UserDistricts>(null);
  const [othersOpen, setOthersOpen] = useState(false);

  useEffect(() => {
    if (!dongCode) {
      setCandidates([]);
      setUserDistricts(null);
      setOthersOpen(false);
      return;
    }

    const cached = readCache(dongCode);
    if (cached) {
      setCandidates(cached.candidates);
      setUserDistricts(cached.userDistricts);
    }

    let cancelled = false;

    void fetchCandidateMessages(dongCode)
      .then((data) => {
        if (cancelled) {
          return;
        }

        const nextCandidates = data.candidates ?? [];
        const nextUserDistricts = data.userDistricts ?? null;

        setCandidates(nextCandidates);
        setUserDistricts(nextUserDistricts);

        writeCache({
          candidates: nextCandidates,
          dongCode,
          userDistricts: nextUserDistricts,
        });
      })
      .catch((error) => {
        console.warn("[CandidateMessagesSection] fetch failed:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [dongCode]);

  const primaryCandidates = candidates.filter(
    (candidate) =>
      candidate.matchType === "local" || candidate.matchType === "metro",
  );
  const otherCandidates = candidates.filter(
    (candidate) => candidate.matchType === "other",
  );

  return {
    candidates,
    collapsedCandidates:
      primaryCandidates.length > 0 ? otherCandidates : ([] as CandidateMessage[]),
    othersOpen,
    primaryCandidates,
    setOthersOpen,
    userDistricts,
    visibleCandidates:
      primaryCandidates.length > 0 ? primaryCandidates : candidates,
  };
}
