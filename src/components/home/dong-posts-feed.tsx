import type { CSSProperties, RefObject } from "react";
import { EmptyState } from "../common/empty-state";
import { ErrorState } from "../common/error-state";
import { LoadingState } from "../common/loading-state";
import { PostListItem } from "../sheet/post-list-item";
import { homeScreenCopy } from "../../lib/content/home-copy";
import type { PostListState } from "../../types/post";
import { uiColors, uiRadius, uiSpacing } from "../../lib/ui/tokens";

type DongPostsFeedProps = {
  activeMenuPostId?: string | null;
  interactionLocked?: boolean;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  shouldObscurePosts: boolean;
  shouldShowPendingUpdatesButton: boolean;
  state: PostListState;
  onCloseMenu?: () => void;
  onLoadMore?: () => void;
  onOpenMenu?: (postId: string) => void;
  onSelectReport?: (postId: string) => void;
  onToggleAgree?: (postId?: string) => void;
};

export function DongPostsFeed({
  activeMenuPostId,
  interactionLocked = false,
  scrollContainerRef,
  shouldObscurePosts,
  shouldShowPendingUpdatesButton,
  state,
  onCloseMenu,
  onLoadMore,
  onOpenMenu,
  onSelectReport,
  onToggleAgree,
}: DongPostsFeedProps) {
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
          padding: `${uiSpacing.lg} ${uiSpacing.pageX} ${
            shouldShowPendingUpdatesButton
              ? "calc(96px + env(safe-area-inset-bottom, 0px))"
              : uiSpacing.xxxl
          }`,
          position: "relative",
          touchAction: interactionLocked ? "none" : "pan-y",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {activeMenuPostId ? (
          <button
            aria-label="메뉴 닫기"
            onClick={onCloseMenu}
            style={{
              appearance: "none",
              background: "transparent",
              border: "none",
              cursor: "default",
              inset: 0,
              padding: 0,
              pointerEvents: "none",
              position: "absolute",
              zIndex: 1,
            }}
            type="button"
          />
        ) : null}

        {state.loading ? <LoadingState label="목록을 불러오는 중" /> : null}
        {state.errorMessage ? <ErrorState message={state.errorMessage} /> : null}

        <div
          className="global-feed-preview"
          data-obscured={shouldObscurePosts ? "true" : undefined}
          style={{
            position: "relative",
          }}
        >
          <div
            className={shouldObscurePosts ? "global-feed-preview__content" : undefined}
          >
            {state.empty ? (
              <EmptyState
                title={homeScreenCopy.emptyTitle}
                description={homeScreenCopy.emptyDescription}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: uiSpacing.md,
                }}
              >
                {state.items.map((item, index) => (
                  <div
                    data-post-id={item.id}
                    key={item.id}
                    className={
                      shouldObscurePosts ? "global-feed-preview__card" : undefined
                    }
                    style={
                      ({
                        animationDelay: shouldObscurePosts
                          ? `${index * 120}ms`
                          : undefined,
                        position: "relative",
                        zIndex: item.id === activeMenuPostId ? 2 : undefined,
                      } satisfies CSSProperties)
                    }
                  >
                    <PostListItem
                      {...item}
                      isMenuOpen={item.id === activeMenuPostId}
                      onCloseMenu={onCloseMenu}
                      onOpenMenu={onOpenMenu}
                      onSelectReport={onSelectReport}
                      onToggleAgree={onToggleAgree}
                    />
                  </div>
                ))}
                {state.nextCursor && !state.loadingMore ? (
                  <button
                    onClick={onLoadMore}
                    style={{
                      appearance: "none",
                      background: "#fffdfa",
                      border: "1px solid #e7dccd",
                      borderRadius: uiRadius.pill,
                      color: uiColors.textStrong,
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: 700,
                      padding: `${uiSpacing.md} ${uiSpacing.lg}`,
                      width: "100%",
                    }}
                    type="button"
                  >
                    더 보기
                  </button>
                ) : null}
                {state.loadingMore ? <LoadingState label="더 불러오는 중" /> : null}
              </div>
            )}
          </div>
          {shouldObscurePosts ? (
            <div aria-hidden="true" className="global-feed-preview__veil">
              <div className="global-feed-preview__badge">
                서비스 이용을 위해 위치 권한을 허용해주세요.
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
