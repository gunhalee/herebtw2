"use client";

import { useEffect, useRef, useState } from "react";

export const COMPOSE_DONG_PLACEHOLDER_LABEL = "\uC6B0\uB9AC \uB3D9\uB124";

const COMPOSE_DONG_FLASHCARD_FLIP_DURATION_MS = 340;
const COMPOSE_DONG_FLASHCARD_INITIAL_DWELL_MS = 120;

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

export function useComposeDongFlashcard({
  label,
  animatePlaceholder,
  onIntroComplete,
}: UseComposeDongFlashcardParams): UseComposeDongFlashcardResult {
  const [currentLabel, setCurrentLabel] = useState(label);
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

  useEffect(() => {
    if (animatePlaceholder) {
      setIntroRequested(true);
    }
  }, [animatePlaceholder]);

  useEffect(() => {
    if (!hasStartedIntroRef.current || hasCompletedIntroRef.current) {
      setCurrentLabel(label);
      setIncomingLabel(null);
      return;
    }

    setIncomingLabel(label);
  }, [label]);

  useEffect(() => {
    if (!introRequested || hasStartedIntroRef.current) {
      return;
    }

    hasStartedIntroRef.current = true;
    setCurrentLabel(COMPOSE_DONG_PLACEHOLDER_LABEL);
    setIncomingLabel(null);

    if (prefersReducedMotion()) {
      setCurrentLabel(finalLabelRef.current);
      completeIntro();
      return;
    }

    let cancelled = false;
    let flipTimer: number | null = null;

    const dwellTimer = window.setTimeout(() => {
      if (cancelled) {
        return;
      }

      setIncomingLabel(finalLabelRef.current);

      flipTimer = window.setTimeout(() => {
        if (cancelled) {
          return;
        }

        setCurrentLabel(finalLabelRef.current);
        setIncomingLabel(null);
        completeIntro();
      }, COMPOSE_DONG_FLASHCARD_FLIP_DURATION_MS);
    }, COMPOSE_DONG_FLASHCARD_INITIAL_DWELL_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(dwellTimer);

      if (flipTimer !== null) {
        window.clearTimeout(flipTimer);
      }
    };
  }, [introRequested]);

  return {
    currentLabel,
    incomingLabel,
  };
}
