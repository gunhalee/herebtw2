"use client";

import { useEffect } from "react";
import { useLatestRef } from "./use-latest-ref";

type VisibilityAwarePollingCallback = (
  isCancelled: () => boolean,
) => void | Promise<void>;

type IdlePollingInterval = {
  idleAfterMs: number;
  intervalMs: number;
};

type UseVisiblePollingParams = {
  enabled: boolean;
  intervalMs: number;
  idleIntervals?: ReadonlyArray<IdlePollingInterval>;
  label?: string;
  maxIntervalMs?: number;
  onTick: VisibilityAwarePollingCallback;
  runImmediately?: boolean;
};

const DEFAULT_BACKOFF_MULTIPLIER = 2;
const ACTIVITY_EVENT_NAMES = [
  "pointerdown",
  "keydown",
  "touchstart",
  "scroll",
  "focus",
] as const;

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Unknown polling error.";
}

export function useVisiblePolling({
  enabled,
  intervalMs,
  idleIntervals,
  label,
  maxIntervalMs = intervalMs,
  onTick,
  runImmediately = true,
}: UseVisiblePollingParams) {
  const onTickRef = useLatestRef(onTick);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    let cancelled = false;
    let inFlight = false;
    let timeoutId: number | null = null;
    let consecutiveFailureCount = 0;
    let lastActivityAt = Date.now();

    const clearScheduledRun = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const getBaseInterval = () => {
      const inactiveForMs = Date.now() - lastActivityAt;

      if (!idleIntervals || idleIntervals.length === 0) {
        return intervalMs;
      }

      let nextIntervalMs = intervalMs;

      for (const idleInterval of idleIntervals) {
        if (inactiveForMs >= idleInterval.idleAfterMs) {
          nextIntervalMs = Math.max(nextIntervalMs, idleInterval.intervalMs);
        }
      }

      return nextIntervalMs;
    };

    const getNextDelay = () => {
      const baseIntervalMs = getBaseInterval();

      if (consecutiveFailureCount === 0) {
        return baseIntervalMs;
      }

      return Math.min(
        maxIntervalMs,
        baseIntervalMs *
          Math.pow(DEFAULT_BACKOFF_MULTIPLIER, consecutiveFailureCount),
      );
    };

    const scheduleNextRun = (delayMs: number) => {
      clearScheduledRun();

      timeoutId = window.setTimeout(() => {
        void run();
      }, delayMs);
    };

    const run = async () => {
      if (cancelled || inFlight) {
        return;
      }

      if (document.hidden) {
        scheduleNextRun(getBaseInterval());
        return;
      }

      inFlight = true;
      clearScheduledRun();

      try {
        await onTickRef.current(() => cancelled);
        consecutiveFailureCount = 0;
      } catch (error) {
        consecutiveFailureCount += 1;

        if (label) {
          console.warn(`[visible-polling] ${label}_failed`, {
            consecutiveFailureCount,
            message: getErrorMessage(error),
          });
        }
      } finally {
        inFlight = false;

        if (!cancelled) {
          scheduleNextRun(getNextDelay());
        }
      }
    };

    const handleActivity = () => {
      lastActivityAt = Date.now();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearScheduledRun();
        return;
      }

      handleActivity();
      void run();
    };

    if (runImmediately) {
      void run();
    } else {
      scheduleNextRun(getBaseInterval());
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    for (const eventName of ACTIVITY_EVENT_NAMES) {
      window.addEventListener(eventName, handleActivity, { passive: true });
    }

    return () => {
      cancelled = true;
      clearScheduledRun();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      for (const eventName of ACTIVITY_EVENT_NAMES) {
        window.removeEventListener(eventName, handleActivity);
      }
    };
  }, [
    enabled,
    idleIntervals,
    intervalMs,
    label,
    maxIntervalMs,
    onTickRef,
    runImmediately,
  ]);
}
