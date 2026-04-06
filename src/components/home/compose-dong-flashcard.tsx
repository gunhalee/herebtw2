"use client";

import { useLayoutEffect, useEffect, useRef, useState } from "react";

export const COMPOSE_DONG_PLACEHOLDER_LABEL = "우리 동네";

const PLACEHOLDER_DONG_CANDIDATES = [
  "역삼1동",
  "연남동",
  "망원1동",
  "성수2가3동",
  "서교동",
  "삼청동",
  "정자동",
  "광안2동",
  "봉천동",
  "평창동",
  "효자동",
  "송도2동",
] as const;
const COMPOSE_DONG_FLASHCARD_FLIP_DURATION_MS = 520;
const COMPOSE_DONG_FLASHCARD_INITIAL_DWELL_MS = 500;
const COMPOSE_DONG_FLASHCARD_DWELL_MS = 820;
const COMPOSE_DONG_FLASHCARD_RANDOM_STEP_COUNT = 3;
const PLACEHOLDER_DONG_LABEL_LENGTH = [...COMPOSE_DONG_PLACEHOLDER_LABEL].length;
const DEFAULT_PLACEHOLDER_DONG_CANDIDATES = PLACEHOLDER_DONG_CANDIDATES.filter(
  (label) => getDongLabelLength(label) <= PLACEHOLDER_DONG_LABEL_LENGTH,
);

function getDongLabelLength(label: string) {
  return [...label].length;
}

function pickRandomDongSequence(
  candidates: readonly string[],
  count: number,
) {
  const shuffled = candidates
    .map((label) => ({
      label,
      sortKey: Math.random(),
    }))
    .sort((left, right) => left.sortKey - right.sortKey)
    .map((item) => item.label);

  return shuffled.slice(0, count);
}

type ComposeDongFlashcardProps = {
  label: string;
  animatePlaceholder: boolean;
};

export function ComposeDongFlashcard({
  label,
  animatePlaceholder,
}: ComposeDongFlashcardProps) {
  const [sequence, setSequence] = useState<string[]>([label]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [incomingLabel, setIncomingLabel] = useState<string | null>(null);
  const [introRequested, setIntroRequested] = useState(animatePlaceholder);
  const [fittingCandidates, setFittingCandidates] = useState<
    readonly string[]
  >(DEFAULT_PLACEHOLDER_DONG_CANDIDATES);
  const [cardWidthPx, setCardWidthPx] = useState<number | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);
  const finalLabelRef = useRef(label);
  const hasStartedIntroRef = useRef(false);
  const hasCompletedIntroRef = useRef(false);
  const placeholderCardWidthRef = useRef<number | null>(null);
  const expandedCardWidthRef = useRef<number | null>(null);
  const introCandidatesRef = useRef<readonly string[]>(
    DEFAULT_PLACEHOLDER_DONG_CANDIDATES,
  );

  function applyCardWidth(mode: "placeholder" | "final") {
    const nextWidth =
      mode === "final"
        ? expandedCardWidthRef.current ?? placeholderCardWidthRef.current
        : placeholderCardWidthRef.current ?? expandedCardWidthRef.current;

    if (typeof nextWidth !== "number") {
      return;
    }

    setCardWidthPx((current) => (current === nextWidth ? current : nextWidth));
  }

  useLayoutEffect(() => {
    if (!measureRef.current || typeof window === "undefined") {
      return;
    }

    let cancelled = false;

    const measureElement = measureRef.current;

    const measureCandidateWidths = () => {
      const originalText = measureElement.textContent;

      const measureWidth = (value: string) => {
        measureElement.textContent = value;
        return Math.ceil(measureElement.getBoundingClientRect().width);
      };

      const nextPlaceholderCardWidthPx = measureWidth(
        COMPOSE_DONG_PLACEHOLDER_LABEL,
      );
      const nextExpandedCardWidthPx = Math.max(
        nextPlaceholderCardWidthPx,
        measureWidth(finalLabelRef.current),
      );
      const nextCandidates = PLACEHOLDER_DONG_CANDIDATES.filter(
        (candidate) => measureWidth(candidate) <= nextPlaceholderCardWidthPx,
      );

      measureElement.textContent =
        originalText ?? COMPOSE_DONG_PLACEHOLDER_LABEL;

      if (cancelled) {
        return;
      }

      placeholderCardWidthRef.current = nextPlaceholderCardWidthPx;
      expandedCardWidthRef.current = nextExpandedCardWidthPx;
      setFittingCandidates(nextCandidates);
      applyCardWidth(
        hasStartedIntroRef.current && !hasCompletedIntroRef.current
          ? "placeholder"
          : "final",
      );
    };

    measureCandidateWidths();

    const handleResize = () => {
      measureCandidateWidths();
    };

    window.addEventListener("resize", handleResize);

    const fontFaceSet = document.fonts;

    void fontFaceSet.ready.then(() => {
      if (!cancelled) {
        measureCandidateWidths();
      }
    });

    return () => {
      cancelled = true;
      window.removeEventListener("resize", handleResize);
    };
  }, [animatePlaceholder, label]);

  useEffect(() => {
    if (animatePlaceholder) {
      setIntroRequested(true);
    }
  }, [animatePlaceholder]);

  useEffect(() => {
    if (!hasStartedIntroRef.current) {
      introCandidatesRef.current = fittingCandidates;
    }
  }, [fittingCandidates]);

  useEffect(() => {
    finalLabelRef.current = label;

    if (hasStartedIntroRef.current && !hasCompletedIntroRef.current) {
      setSequence((current) => {
        if (current.length <= 1) {
          return current;
        }

        const next = [...current];
        next[next.length - 1] = label;
        return next;
      });

      return;
    }

    setSequence([label]);
    setCurrentIndex(0);
    setIncomingLabel(null);
  }, [label]);

  useEffect(() => {
    if (!introRequested && !hasStartedIntroRef.current) {
      setSequence([finalLabelRef.current]);
      setCurrentIndex(0);
      setIncomingLabel(null);
      applyCardWidth("final");
      return;
    }

    if (!introRequested || hasStartedIntroRef.current) {
      return;
    }

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      hasStartedIntroRef.current = true;
      hasCompletedIntroRef.current = true;
      setSequence([finalLabelRef.current]);
      setCurrentIndex(0);
      setIncomingLabel(null);
      applyCardWidth("final");
      return;
    }

    hasStartedIntroRef.current = true;
    hasCompletedIntroRef.current = false;

    const introSequence = [
      COMPOSE_DONG_PLACEHOLDER_LABEL,
      ...pickRandomDongSequence(
        introCandidatesRef.current,
        COMPOSE_DONG_FLASHCARD_RANDOM_STEP_COUNT,
      ),
      finalLabelRef.current,
    ];

    applyCardWidth("placeholder");
    setSequence(introSequence);
    setCurrentIndex(0);
    setIncomingLabel(null);

    let cancelled = false;
    let dwellTimer: number | null = null;
    let flipTimer: number | null = null;

    function getStepLabel(index: number) {
      if (index === introSequence.length - 1) {
        return finalLabelRef.current;
      }

      return introSequence[index]!;
    }

    function queueFlip(index: number) {
      if (cancelled || index >= introSequence.length - 1) {
        hasCompletedIntroRef.current = true;
        return;
      }

      dwellTimer = window.setTimeout(() => {
        const nextIndex = index + 1;
        const nextLabel = getStepLabel(nextIndex);

        if (nextIndex >= introSequence.length - 1) {
          applyCardWidth("final");
        }

        setIncomingLabel(nextLabel);

        flipTimer = window.setTimeout(() => {
          if (cancelled) {
            return;
          }

          if (nextIndex >= introSequence.length - 1) {
            hasCompletedIntroRef.current = true;
            setSequence([finalLabelRef.current]);
            setCurrentIndex(0);
            setIncomingLabel(null);
            return;
          }

          setCurrentIndex(nextIndex);
          setIncomingLabel(null);
          queueFlip(nextIndex);
        }, COMPOSE_DONG_FLASHCARD_FLIP_DURATION_MS);
      }, index === 0
        ? COMPOSE_DONG_FLASHCARD_INITIAL_DWELL_MS
        : COMPOSE_DONG_FLASHCARD_DWELL_MS);
    }

    queueFlip(0);

    return () => {
      cancelled = true;

      if (dwellTimer) {
        window.clearTimeout(dwellTimer);
      }

      if (flipTimer) {
        window.clearTimeout(flipTimer);
      }
    };
  }, [introRequested]);

  const currentLabel = sequence[currentIndex] ?? label;

  return (
    <>
      <span
        aria-hidden="true"
        className="compose-dong-flashcard__card compose-dong-flashcard__card--measure"
        ref={measureRef}
      >
        {COMPOSE_DONG_PLACEHOLDER_LABEL}
      </span>
      <span
        className="compose-dong-flashcard"
        style={cardWidthPx ? { width: `${cardWidthPx}px` } : undefined}
      >
        <span
          aria-hidden="true"
          className="compose-dong-flashcard__card compose-dong-flashcard__card--sizer"
        >
          {COMPOSE_DONG_PLACEHOLDER_LABEL}
        </span>
        <span
          className={`compose-dong-flashcard__card${
            incomingLabel ? " compose-dong-flashcard__card--leaving" : ""
          }`}
        >
          {currentLabel}
        </span>
        {incomingLabel ? (
          <span className="compose-dong-flashcard__card compose-dong-flashcard__card--entering">
            {incomingLabel}
          </span>
        ) : null}
      </span>
    </>
  );
}
