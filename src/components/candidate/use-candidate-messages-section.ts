"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import type {
  CandidateMessage,
  CandidateMessagesPayload,
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

function applyCandidateMessageState(
  nextState: CandidateMessagesPayload | null,
  options: {
    setCandidates: (next: CandidateMessage[]) => void;
    setUserDistricts: (next: UserDistricts) => void;
  },
) {
  options.setCandidates(nextState?.candidates ?? []);
  options.setUserDistricts(nextState?.userDistricts ?? null);
}

export function useCandidateMessagesSection(
  dongCode: string | null,
  initialData?: CandidateMessagesPayload | null,
  initialDongCode?: string | null,
) {
  const matchedInitialData =
    dongCode && initialDongCode === dongCode ? initialData ?? null : null;
  const [candidates, setCandidates] = useState<CandidateMessage[]>(
    matchedInitialData?.candidates ?? [],
  );
  const [userDistricts, setUserDistricts] = useState<UserDistricts>(
    matchedInitialData?.userDistricts ?? null,
  );
  const [isResolved, setIsResolved] = useState(
    !dongCode || Boolean(matchedInitialData),
  );
  const [othersOpen, setOthersOpen] = useState(false);

  useLayoutEffect(() => {
    if (!dongCode) {
      setCandidates([]);
      setUserDistricts(null);
      setIsResolved(true);
      setOthersOpen(false);
      return;
    }

    const cached = readCache(dongCode);
    applyCandidateMessageState(cached ?? matchedInitialData ?? null, {
      setCandidates,
      setUserDistricts,
    });
    setIsResolved(Boolean(cached ?? matchedInitialData));
    setOthersOpen(false);
  }, [dongCode, matchedInitialData]);

  useEffect(() => {
    if (!dongCode) {
      return;
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
        setIsResolved(true);

        writeCache({
          candidates: nextCandidates,
          dongCode,
          userDistricts: nextUserDistricts,
        });
      })
      .catch((error) => {
        console.warn("[CandidateMessagesSection] fetch failed:", error);
        if (!cancelled) {
          setIsResolved(true);
        }
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
    isResolved,
  };
}
