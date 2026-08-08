"use client";

import { startTransition, useEffect, useRef, useState, type ReactNode } from "react";
import { fetchClientApiData } from "../../lib/api/client";
import type { CandidateMessagesPayload } from "../candidate/candidate-messages-view";
import type { AppShellState } from "../../types/device";
import type { PostListState } from "../../types/post";

type HomeBootstrapData = {
  appShellState: AppShellState;
  candidateMessages: CandidateMessagesPayload | null;
  postListState: PostListState;
};

type HomeScreenModule = typeof import("./home-screen");

type InteractiveHomeState = {
  HomeScreen: HomeScreenModule["HomeScreen"];
  data: HomeBootstrapData;
};

const HOME_BOOTSTRAP_API_PATH = "/api/home/bootstrap";
const HOME_BOOTSTRAP_IDLE_TIMEOUT_MS = 300;

export function HomeScreenBootstrap({
  children,
}: {
  children: ReactNode;
}) {
  const [interactiveHome, setInteractiveHome] = useState<InteractiveHomeState | null>(
    null,
  );
  const bootPromiseRef = useRef<Promise<void> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  function loadInteractiveHome() {
    if (interactiveHome || bootPromiseRef.current) {
      return;
    }

    bootPromiseRef.current = Promise.all([
      import("./home-screen"),
      fetchClientApiData<HomeBootstrapData>({
        errorMessage: "Unable to prepare the home screen.",
        path: HOME_BOOTSTRAP_API_PATH,
        timeoutErrorMessage:
          "Preparing the home screen is taking longer than expected.",
      }),
    ])
      .then(([module, data]) => {
        if (!mountedRef.current) {
          return;
        }

        startTransition(() => {
          setInteractiveHome({
            HomeScreen: module.HomeScreen,
            data,
          });
        });
      })
      .catch(() => {
        if (!mountedRef.current) {
          return;
        }

        bootPromiseRef.current = null;
      });
  }

  useEffect(() => {
    if (interactiveHome || typeof window === "undefined") {
      return;
    }

    const requestIdleCallback =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback.bind(window)
        : null;

    if (requestIdleCallback) {
      const idleId = requestIdleCallback(
        () => {
          loadInteractiveHome();
        },
        {
          timeout: HOME_BOOTSTRAP_IDLE_TIMEOUT_MS,
        },
      );

      return () => {
        if (typeof window.cancelIdleCallback === "function") {
          window.cancelIdleCallback(idleId);
        }
      };
    }

    const timeoutId = globalThis.setTimeout(() => {
      loadInteractiveHome();
    }, HOME_BOOTSTRAP_IDLE_TIMEOUT_MS);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [interactiveHome]);

  if (interactiveHome) {
    const { HomeScreen, data } = interactiveHome;

    return (
      <HomeScreen
        initialAppShellState={data.appShellState}
        initialCandidateMessages={data.candidateMessages}
        initialPostListState={data.postListState}
      />
    );
  }

  return (
    <div
      onKeyDownCapture={loadInteractiveHome}
      onPointerDownCapture={loadInteractiveHome}
    >
      {children}
    </div>
  );
}
