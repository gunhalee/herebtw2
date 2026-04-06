"use client";

import { useEffect, useRef } from "react";
import type { PostListState } from "../../types/post";
import { uiColors, uiRadius, uiSpacing } from "../../lib/ui/tokens";
import { DongPostsFeed } from "./dong-posts-feed";
import { DongPostsHeader } from "./dong-posts-header";
import { HomeReportDialogs } from "./home-report-dialogs";

type DongPostsScreenProps = {
  currentDongName: string;
  animateComposeDongPlaceholder?: boolean;
  interactionLocked?: boolean;
  scrollTargetPostId?: string | null;
  state: PostListState;
  runtimeNotice?: string | null;
  reportErrorMessage?: string | null;
  reportSuccessMessage?: string | null;
  pendingNewItemsCount?: number;
  activeMenuPostId?: string | null;
  activeReportPostId?: string | null;
  reportSubmitting?: boolean;
  obscurePosts?: boolean;
  onCompose?: () => void;
  onApplyPendingUpdates?: () => void;
  onLoadMore?: () => void;
  onScrollTargetApplied?: () => void;
  onToggleAgree?: (postId?: string) => void;
  onOpenMenu?: (postId: string) => void;
  onCloseMenu?: () => void;
  onSelectReport?: (postId: string) => void;
  onCloseReportDialog?: () => void;
  onCloseReportSuccessDialog?: () => void;
  onConfirmReport?: () => void;
};

export function DongPostsScreen({
  currentDongName,
  animateComposeDongPlaceholder = false,
  interactionLocked = false,
  scrollTargetPostId,
  state,
  runtimeNotice,
  reportErrorMessage = null,
  reportSuccessMessage = null,
  pendingNewItemsCount = 0,
  activeMenuPostId,
  activeReportPostId,
  reportSubmitting = false,
  obscurePosts = false,
  onCompose,
  onApplyPendingUpdates,
  onLoadMore,
  onScrollTargetApplied,
  onToggleAgree,
  onOpenMenu,
  onCloseMenu,
  onSelectReport,
  onCloseReportDialog,
  onCloseReportSuccessDialog,
  onConfirmReport,
}: DongPostsScreenProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const reportDialogOpen = state.items.some((item) => item.id === activeReportPostId);
  const shouldObscurePosts =
    obscurePosts && !state.loading && !state.errorMessage && !state.empty;
  const shouldShowPendingUpdatesButton =
    pendingNewItemsCount > 0 && !shouldObscurePosts;

  function handleScreenClickCapture(event: React.MouseEvent<HTMLElement>) {
    if (!activeMenuPostId) {
      return;
    }

    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.closest(`[data-post-id="${activeMenuPostId}"]`)) {
      return;
    }

    onCloseMenu?.();
  }

  useEffect(() => {
    if (!scrollTargetPostId || !scrollContainerRef.current) {
      return;
    }

    let frameId = 0;

    const scrollToTarget = () => {
      const container = scrollContainerRef.current;

      if (!container) {
        return;
      }

      const targetElement = container.querySelector<HTMLElement>(
        `[data-post-id="${scrollTargetPostId}"]`,
      );

      if (!targetElement) {
        return;
      }

      const containerTop = container.getBoundingClientRect().top;
      const targetTop = targetElement.getBoundingClientRect().top;
      const nextScrollTop = container.scrollTop + (targetTop - containerTop) - 16;

      container.scrollTo({
        top: Math.max(0, nextScrollTop),
        behavior: "smooth",
      });
      onScrollTargetApplied?.();
    };

    frameId = window.requestAnimationFrame(scrollToTarget);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [onScrollTargetApplied, scrollTargetPostId]);

  return (
    <section
      aria-label="nearby-posts-screen"
      onClickCapture={handleScreenClickCapture}
      style={{
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <DongPostsHeader
        animateComposeDongPlaceholder={animateComposeDongPlaceholder}
        currentDongName={currentDongName}
        onCompose={onCompose}
        runtimeNotice={runtimeNotice}
      />

      <DongPostsFeed
        activeMenuPostId={activeMenuPostId}
        interactionLocked={interactionLocked}
        onCloseMenu={onCloseMenu}
        onLoadMore={onLoadMore}
        onOpenMenu={onOpenMenu}
        onSelectReport={onSelectReport}
        onToggleAgree={onToggleAgree}
        scrollContainerRef={scrollContainerRef}
        shouldObscurePosts={shouldObscurePosts}
        shouldShowPendingUpdatesButton={shouldShowPendingUpdatesButton}
        state={state}
      />

      {shouldShowPendingUpdatesButton ? (
        <div
          style={{
            bottom: "calc(20px + env(safe-area-inset-bottom, 0px))",
            display: "flex",
            justifyContent: "center",
            left: uiSpacing.pageX,
            pointerEvents: "none",
            position: "absolute",
            right: uiSpacing.pageX,
            zIndex: 12,
          }}
        >
          <button
            onClick={onApplyPendingUpdates}
            style={{
              alignItems: "center",
              appearance: "none",
              background: "linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%)",
              border: "1px solid rgba(255, 255, 255, 0.34)",
              borderRadius: uiRadius.pill,
              boxShadow: "0 14px 32px rgba(96, 165, 250, 0.26)",
              color: uiColors.textInverse,
              cursor: "pointer",
              display: "inline-flex",
              fontSize: "14px",
              fontWeight: 700,
              justifyContent: "center",
              minHeight: "48px",
              padding: `${uiSpacing.md} ${uiSpacing.xxl}`,
              pointerEvents: "auto",
            }}
            type="button"
          >
            새 글 {pendingNewItemsCount}개 이어보기
          </button>
        </div>
      ) : null}

      <HomeReportDialogs
        onCloseReportDialog={onCloseReportDialog}
        onCloseReportSuccessDialog={onCloseReportSuccessDialog}
        onConfirmReport={onConfirmReport}
        reportDialogOpen={reportDialogOpen}
        reportErrorMessage={reportErrorMessage}
        reportSubmitting={reportSubmitting}
        reportSuccessMessage={reportSuccessMessage}
      />
    </section>
  );
}
