"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { RefObject } from "react";
import type { CandidateMessagesPayload } from "../candidate/candidate-messages-view";
import { VeilOverlay } from "../common/veil-overlay";
import { ErrorState } from "../common/error-state";
import { LoadingState } from "../common/loading-state";
import type { PostListState } from "../../types/post";
import { uiColors, uiSpacing } from "../../lib/ui/tokens";
import { DongPostsFeedContent } from "./dong-posts-feed-content";

const DeferredCandidateMessagesSection = dynamic(
  () =>
    import("../candidate/candidate-messages-section").then(
      (module) => module.CandidateMessagesSection,
    ),
  {
    loading: () => null,
    ssr: false,
  },
);

type DongPostsFeedProps = {
  activeMenuPostId?: string | null;
  dongCode?: string | null;
  interactionLocked?: boolean;
  initialCandidateMessages?: CandidateMessagesPayload | null;
  initialCandidateMessagesDongCode?: string | null;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  shouldObscurePosts: boolean;
  shouldShowPendingUpdatesButton: boolean;
  state: PostListState;
  onCloseMenu?: () => void;
  onLoadMore?: () => void;
  onOpenMenu?: (postId: string) => void;
  onSelectCandidate?: (candidateId: string) => void;
  onSelectReport?: (postId: string) => void;
  onToggleAgree?: (postId?: string) => void;
};

export function DongPostsFeed({
  activeMenuPostId,
  dongCode = null,
  interactionLocked = false,
  initialCandidateMessages = null,
  initialCandidateMessagesDongCode = null,
  scrollContainerRef,
  shouldObscurePosts,
  shouldShowPendingUpdatesButton,
  state,
  onCloseMenu,
  onLoadMore,
  onOpenMenu,
  onSelectCandidate,
  onSelectReport,
  onToggleAgree,
}: DongPostsFeedProps) {
  const [readyCandidateSectionDongCode, setReadyCandidateSectionDongCode] =
    useState<string | null>(null);
  const bottomPadding = shouldShowPendingUpdatesButton
    ? "calc(172px + env(safe-area-inset-bottom, 0px))"
    : "calc(108px + env(safe-area-inset-bottom, 0px))";
  const shouldKeepVeilForCandidateSection =
    Boolean(dongCode) && readyCandidateSectionDongCode !== dongCode;
  const shouldRenderVeil =
    shouldObscurePosts || shouldKeepVeilForCandidateSection;

  useEffect(() => {
    scrollContainerRef.current?.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }, [dongCode, scrollContainerRef]);

  useEffect(() => {
    if (!dongCode) {
      setReadyCandidateSectionDongCode(null);
    }
  }, [dongCode]);

  function handleCandidateSectionReady(readyDongCode: string) {
    setReadyCandidateSectionDongCode(readyDongCode);
  }

  return (
    <div
      style={{
        background: uiColors.surface,
        display: "flex",
        flex: 1,
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
        pointerEvents: interactionLocked ? "none" : "auto",
        position: "relative",
        touchAction: interactionLocked ? "none" : "auto",
      }}
    >
      <div
        ref={scrollContainerRef}
        style={{
          background: uiColors.surface,
          display: "flex",
          flexDirection: "column",
          gap: uiSpacing.md,
          minHeight: 0,
          overflowY: interactionLocked ? "hidden" : "auto",
          overscrollBehaviorY: interactionLocked ? "none" : "contain",
          padding: `${uiSpacing.lg} ${uiSpacing.pageX} ${bottomPadding}`,
          position: "relative",
          touchAction: interactionLocked ? "none" : "pan-y",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {activeMenuPostId ? (
          <button
            aria-label="Close menu"
            onClick={onCloseMenu}
            style={{
              appearance: "none",
              background: "transparent",
              border: "none",
              cursor: "default",
              inset: 0,
              padding: 0,
              pointerEvents: "auto",
              position: "absolute",
              zIndex: 1,
            }}
            type="button"
          />
        ) : null}

        {state.loading ? <LoadingState label="Loading posts" /> : null}
        {state.errorMessage ? <ErrorState message={state.errorMessage} /> : null}

        {dongCode ? (
          <DeferredCandidateMessagesSection
            dongCode={dongCode}
            initialData={initialCandidateMessages}
            initialDongCode={initialCandidateMessagesDongCode}
            onReady={handleCandidateSectionReady}
            onSelectCandidate={onSelectCandidate}
          />
        ) : null}

        <div
          className="global-feed-preview"
          data-obscured={shouldRenderVeil ? "true" : undefined}
          style={{
            position: "relative",
          }}
        >
          <div
            className={shouldRenderVeil ? "global-feed-preview__content" : undefined}
          >
            <DongPostsFeedContent
              activeMenuPostId={activeMenuPostId}
              shouldObscurePosts={shouldRenderVeil}
              state={state}
              onCloseMenu={onCloseMenu}
              onLoadMore={onLoadMore}
              onOpenMenu={onOpenMenu}
              onSelectReport={onSelectReport}
              onToggleAgree={onToggleAgree}
            />
          </div>
        </div>
      </div>

      {shouldRenderVeil ? <VeilOverlay /> : null}
    </div>
  );
}
