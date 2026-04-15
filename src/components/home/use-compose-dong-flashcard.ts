"use client";

import { useEffect, useRef, useState } from "react";

export const COMPOSE_DONG_PLACEHOLDER_LABEL = "\uC6B0\uB9AC \uB3D9\uB124";

const PLACEHOLDER_DONG_CANDIDATES = [
  "\uC0BC\uC1311\uB3D9",
  "\uC5ED\uC0BC1\uB3D9",
  "\uC11C\uAD50\uB3D9",
  "\uC2E0\uCD0C\uB3D9",
  "\uC591\uC7AC1\uB3D9",
  "\uD589\uAD81\uB3D9",
  "\uB9DD\uC6D01\uB3D9",
  "\uC1A1\uD30C2\uB3D9",
] as const;
const COMPOSE_DONG_FLASHCARD_FLIP_DURATION_MS = 340;
const COMPOSE_DONG_FLASHCARD_INITIAL_DWELL_MS = 120;
const COMPOSE_DONG_FLASHCARD_DWELL_MS = 180;
const COMPOSE_DONG_FLASHCARD_RANDOM_STEP_COUNT = 5;

type UseComposeDongFlashcardParams = {
  label: string;
  animatePlaceholder: boolean;
  onIntroComplete?: () => void;
};

type UseComposeDongFlashcardResult = {
  currentLabel: string;
  incomingLabel: string | null;
};

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function pickRandomDongSequence(candidates: readonly string[], count: number) {
  const shuffled = candidates
    .map((candidate) => ({
      candidate,
      sortKey: Math.random(),
    }))
    .sort((left, right) => left.sortKey - right.sortKey)
    .map((item) => item.candidate);

  return shuffled.slice(0, count);
}

function buildIntroSequence(finalLabel: string) {
  return [
    COMPOSE_DONG_PLACEHOLDER_LABEL,
    ...pickRandomDongSequence(
      PLACEHOLDER_DONG_CANDIDATES,
      COMPOSE_DONG_FLASHCARD_RANDOM_STEP_COUNT,
    ),
    finalLabel,
  ];
}

export function useComposeDongFlashcard({
  label,
  animatePlaceholder,
  onIntroComplete,
}: UseComposeDongFlashcardParams): UseComposeDongFlashcardResult {
  const [sequence, setSequence] = useState<string[]>(() =>
    animatePlaceholder ? buildIntroSequence(label) : [label],
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [incomingLabel, setIncomingLabel] = useState<string | null>(null);
  const [introRequested, setIntroRequested] = useState(animatePlaceholder);
  const finalLabelRef = useRef(label);
  const hasStartedIntroRef = useRef(false);
  const hasCompletedIntroRef = useRef(false);
  const hasReportedIntroCompleteRef = useRef(false);
  const onIntroCompleteRef = useRef(onIntroComplete);

  finalLabelRef.current = label;
  onIntroCompleteRef.current = onIntroComplete;

  function completeIntro() {
    hasCompletedIntroRef.current = true;

    if (hasReportedIntroCompleteRef.current) {
      return;
    }

    hasReportedIntroCompleteRef.current = true;
    onIntroCompleteRef.current?.();
  }

  function resetToFinalLabel() {
    setSequence([finalLabelRef.current]);
    setCurrentIndex(0);
    setIncomingLabel(null);
  }

  useEffect(() => {
    if (animatePlaceholder) {
      setIntroRequested(true);
    }
  }, [animatePlaceholder]);

  useEffect(() => {
    if (!hasStartedIntroRef.current || hasCompletedIntroRef.current) {
      resetToFinalLabel();
      return;
    }

    setSequence((current) => {
      if (current.length <= 1) {
        return current;
      }

      const next = [...current];
      next[next.length - 1] = label;
      return next;
    });
  }, [label]);

  useEffect(() => {
    if (!introRequested || hasStartedIntroRef.current) {
      return;
    }

    hasStartedIntroRef.current = true;
    const introSequence = buildIntroSequence(finalLabelRef.current);
    setSequence(introSequence);
    setCurrentIndex(0);
    setIncomingLabel(null);

    if (prefersReducedMotion()) {
      resetToFinalLabel();
      completeIntro();
      return;
    }

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
      if (cancelled) {
        return;
      }

      if (index >= introSequence.length - 1) {
        completeIntro();
        return;
      }

      dwellTimer = window.setTimeout(() => {
        if (cancelled) {
          return;
        }

        const nextIndex = index + 1;
        const nextLabel = getStepLabel(nextIndex);
        setIncomingLabel(nextLabel);

        flipTimer = window.setTimeout(() => {
          if (cancelled) {
            return;
          }

          if (nextIndex >= introSequence.length - 1) {
            setSequence([finalLabelRef.current]);
            setCurrentIndex(0);
            setIncomingLabel(null);
            completeIntro();
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

      if (dwellTimer !== null) {
        window.clearTimeout(dwellTimer);
      }

      if (flipTimer !== null) {
        window.clearTimeout(flipTimer);
      }
    };
  }, [introRequested]);

  return {
    currentLabel: sequence[currentIndex] ?? label,
    incomingLabel,
  };
}
