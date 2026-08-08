"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { CandidateMessagesPayload } from "../candidate/candidate-messages-view";
import { DongPostsScreen } from "./dong-posts-screen";
import { type PendingFeedSnapshot } from "./home-feed-state";
import { useHomeComposeFlow } from "./use-home-compose-flow";
import { useHomeFeedListActions } from "./use-home-feed-list-actions";
import { useHomeFeedLifecycle } from "./use-home-feed-lifecycle";
import { useHomePostActions } from "./use-home-post-actions";
import { useHomeLocationAccess } from "./use-home-location-access";
import { useHomeShellState } from "./use-home-shell-state";
import { useLatestRef } from "../../lib/hooks/use-latest-ref";
import type { AppShellState } from "../../types/device";
import type { PostListState } from "../../types/post";

const DeferredPostComposeExperience = dynamic(
  () =>
    import("../post/post-compose-experience").then(
      (module) => module.PostComposeExperience,
    ),
  {
    loading: () => null,
    ssr: false,
  },
);

const DeferredComposePermissionDialog = dynamic(
  () =>
    import("./compose-permission-dialog").then(
      (module) => module.ComposePermissionDialog,
    ),
  {
    loading: () => null,
    ssr: false,
  },
);

const DeferredAdministrativeAreaSearchDialog = dynamic(
  () =>
    import("./administrative-area-search-dialog").then(
      (module) => module.AdministrativeAreaSearchDialog,
    ),
  {
    loading: () => null,
    ssr: false,
  },
);

type HomeScreenProps = {
  initialAppShellState: AppShellState;
  initialCandidateMessages: CandidateMessagesPayload | null;
  initialPostListState: PostListState;
};

export function HomeScreen({
  initialAppShellState,
  initialCandidateMessages,
  initialPostListState,
}: HomeScreenProps) {
  const router = useRouter();
  const [postListState, setPostListState] = useState(initialPostListState);
  const [pendingFeedSnapshot, setPendingFeedSnapshot] =
    useState<PendingFeedSnapshot | null>(null);
  const [pendingAppliedScrollTargetPostId, setPendingAppliedScrollTargetPostId] =
    useState<string | null>(null);
  const postListStateRef = useLatestRef(postListState);
  const syncInFlightRef = useRef(false);
  const engagementSyncInFlightRef = useRef(false);
  const shouldAnimateComposeDongPlaceholder = true;

  const {
    appShellStateRef,
    applyDeniedLocationMode,
    applyResolvedLocationSelection,
    currentDongName,
    selectedDongCode,
    ensureDeviceReady,
    feedLocation,
    feedLocationRef,
    feedSortMode,
    hasInitialGlobalFeed,
    isMountedRef,
    obscureGlobalFallbackList,
    setAppShellState,
    setFeedSortMode,
  } = useHomeShellState({
    initialAppShellState,
    initialPostListState,
  });

  const {
    activeMenuPostId,
    handleApplyPendingFeedSnapshot,
    handleCloseMenu,
    handleLoadMore,
    handleOpenMenu,
  } = useHomeFeedListActions({
    appShellStateRef,
    feedSortMode,
    postListState,
    postListStateRef,
    feedLocation,
    setFeedSortMode,
    setPostListState,
    pendingFeedSnapshot,
    setPendingFeedSnapshot,
    setPendingAppliedScrollTargetPostId,
  });

  const {
    activeReportPostId,
    agreePendingPostIdsRef,
    reportErrorMessage,
    reportSubmitting,
    reportSuccessMessage,
    handleCloseReportDialog,
    handleCloseReportSuccessDialog,
    handleReport,
    handleSelectReport,
    handleToggleAgree,
  } = useHomePostActions({
    postListStateRef,
    feedLocationRef,
    setPostListState,
    setPendingFeedSnapshot,
    ensureDeviceReady,
    closeMenu: handleCloseMenu,
  });

  const {
    composeLocating,
    composeMaximumAccuracyMeters,
    composePanelOpen,
    composePermissionDialogOpen,
    composePermissionDialogGuidance,
    handleCloseComposePanel,
    handleCloseComposePermissionDialog,
    handleCloseManualLocationSearch,
    handleCompose,
    handleComposeSuccess,
    handleOpenManualLocationSearch,
    handleRetryCompose,
    handleSelectManualLocation,
    manualLocationSearchOpen,
    manualLocationSelection,
  } = useHomeComposeFlow({
    isMountedRef,
    appShellStateRef,
    feedLocationRef,
    applyResolvedLocationSelection,
    setFeedSortMode,
    setPostListState,
    setPendingFeedSnapshot,
    closeMenu: handleCloseMenu,
  });

  const {
    bannerGuidance,
    handleCloseLocationAccessDialog,
    handleRequestLocationAccess,
    handleRetryLocationAccess,
    locationAccessDialogGuidance,
    locationAccessDialogOpen,
    locationAccessRequesting,
    shouldShowLocationAccessBanner,
  } = useHomeLocationAccess({
    appShellStateRef,
    applyDeniedLocationMode,
    applyResolvedLocationSelection,
    setFeedSortMode,
    setPendingFeedSnapshot,
    setPostListState,
  });

  useHomeFeedLifecycle({
    feedLocation,
    feedSortMode,
    hasInitialGlobalFeed,
    initialPostListState,
    appShellStateRef,
    feedLocationRef,
    postListStateRef,
    agreePendingPostIdsRef,
    syncInFlightRef,
    engagementSyncInFlightRef,
    applyDeniedLocationMode,
    applyResolvedLocationSelection,
    setAppShellState,
    setFeedSortMode,
    setPostListState,
    setPendingFeedSnapshot,
  });

  function handleSelectCandidate(candidateId: string) {
    router.push(`/voices/candidate/${encodeURIComponent(candidateId)}`);
  }

  function handleOpenManualLocationSearchFromAccessDialog() {
    handleCloseLocationAccessDialog();
    handleOpenManualLocationSearch();
  }

  return (
    <div
      style={{
        background: "#ffffff",
        height: "100dvh",
        inset: 0,
        overflow: "hidden",
        position: "fixed",
        width: "100%",
      }}
    >
      <DongPostsScreen
        activeMenuPostId={activeMenuPostId}
        activeReportPostId={activeReportPostId}
        animateComposeDongPlaceholder={shouldAnimateComposeDongPlaceholder}
        currentDongName={currentDongName}
        composeLocating={composeLocating}
        dongCode={selectedDongCode}
        initialCandidateMessages={initialCandidateMessages}
        initialCandidateMessagesDongCode={initialAppShellState.selectedDongCode}
        interactionLocked={
          composeLocating ||
          composePanelOpen ||
          composePermissionDialogOpen ||
          manualLocationSearchOpen ||
          locationAccessRequesting ||
          locationAccessDialogOpen
        }
        locationAccessGuidance={
          shouldShowLocationAccessBanner ? bannerGuidance : null
        }
        locationAccessRequesting={locationAccessRequesting}
        obscurePosts={obscureGlobalFallbackList}
        onApplyPendingUpdates={handleApplyPendingFeedSnapshot}
        onCloseMenu={handleCloseMenu}
        onCloseReportDialog={handleCloseReportDialog}
        onCloseReportSuccessDialog={handleCloseReportSuccessDialog}
        onCompose={handleCompose}
        onRequestLocationAccess={handleRequestLocationAccess}
        onConfirmReport={handleReport}
        onLoadMore={handleLoadMore}
        onManualLocationSearch={handleOpenManualLocationSearch}
        onOpenMenu={handleOpenMenu}
        onScrollTargetApplied={() => setPendingAppliedScrollTargetPostId(null)}
        onSelectCandidate={handleSelectCandidate}
        onSelectReport={handleSelectReport}
        onToggleAgree={handleToggleAgree}
        pendingNewItemsCount={pendingFeedSnapshot?.newItemsCount ?? 0}
        reportErrorMessage={reportErrorMessage}
        reportSubmitting={reportSubmitting}
        reportSuccessMessage={reportSuccessMessage}
        scrollTargetPostId={pendingAppliedScrollTargetPostId}
        state={postListState}
      />
      {composePanelOpen ? (
        <DeferredPostComposeExperience
          manualLocationSelection={manualLocationSelection}
          maximumAccuracyMeters={composeMaximumAccuracyMeters}
          onChangeLocation={handleOpenManualLocationSearch}
          onDismiss={handleCloseComposePanel}
          onSuccess={handleComposeSuccess}
        />
      ) : null}
      {composePermissionDialogOpen ? (
        <DeferredComposePermissionDialog
          guidance={composePermissionDialogGuidance!}
          onClose={handleCloseComposePermissionDialog}
          onManualSearch={handleOpenManualLocationSearch}
          onRetry={handleRetryCompose}
        />
      ) : null}
      {locationAccessDialogOpen ? (
        <DeferredComposePermissionDialog
          guidance={locationAccessDialogGuidance!}
          onClose={handleCloseLocationAccessDialog}
          onManualSearch={handleOpenManualLocationSearchFromAccessDialog}
          onRetry={handleRetryLocationAccess}
        />
      ) : null}
      {manualLocationSearchOpen ? (
        <DeferredAdministrativeAreaSearchDialog
          onClose={handleCloseManualLocationSearch}
          onSelect={handleSelectManualLocation}
        />
      ) : null}
    </div>
  );
}
