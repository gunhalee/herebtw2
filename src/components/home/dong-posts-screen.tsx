"use client";

import Image from "next/image";
import { EmptyState } from "../common/empty-state";
import { ErrorState } from "../common/error-state";
import { LoadingState } from "../common/loading-state";
import penWritingImage from "../pen_writing.png";
import { PostListItem } from "../sheet/post-list-item";
import type { PostListState } from "../../types/post";
import { uiColors, uiRadius, uiSpacing } from "../../lib/ui/tokens";

export type DongPostsScreenProps = {
  currentDongName: string;
  state: PostListState;
  runtimeNotice?: string | null;
  activeMenuPostId?: string | null;
  activeReportPostId?: string | null;
  reportSubmitting?: boolean;
  onCompose?: () => void;
  onToggleAgree?: (postId?: string) => void;
  onOpenMenu?: (postId: string) => void;
  onCloseMenu?: () => void;
  onSelectReport?: (postId: string) => void;
  onCloseReportDialog?: () => void;
  onConfirmReport?: () => void;
};

export function DongPostsScreen({
  currentDongName,
  state,
  runtimeNotice,
  activeMenuPostId,
  activeReportPostId,
  reportSubmitting = false,
  onCompose,
  onToggleAgree,
  onOpenMenu,
  onCloseMenu,
  onSelectReport,
  onCloseReportDialog,
  onConfirmReport,
}: DongPostsScreenProps) {
  const activeReportPost =
    state.items.find((item) => item.id === activeReportPostId) ?? null;

  return (
    <section
      aria-label="nearby-posts-screen"
      style={{
        background: "#f7f4ec",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <header
        style={{
          background:
            "linear-gradient(180deg, rgba(247,244,236,0.98), rgba(247,244,236,0.92))",
          backdropFilter: "blur(10px)",
          boxShadow: "0 8px 14px rgba(17, 24, 39, 0.08)",
          display: "flex",
          flexDirection: "column",
          gap: uiSpacing.md,
          padding: `${uiSpacing.pageY} ${uiSpacing.pageX} ${uiSpacing.xxl}`,
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            alignItems: "baseline",
            display: "flex",
            flexWrap: "wrap",
            gap: uiSpacing.sm,
          }}
        >
          <h1
            style={{
              color: uiColors.textStrong,
              fontSize: "26px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            여기 근데
          </h1>
          <span
            style={{
              color: uiColors.textMuted,
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            동네 이야기만 빠르게
          </span>
        </div>

        {runtimeNotice ? (
          <div
            style={{
              background: "#fff7ed",
              border: "1px solid #fdba74",
              borderRadius: uiRadius.md,
              color: "#9a3412",
              fontSize: "12px",
              lineHeight: 1.5,
              padding: `${uiSpacing.sm} ${uiSpacing.md}`,
            }}
          >
            {runtimeNotice}
          </div>
        ) : null}

        <button
          onClick={onCompose}
          style={{
            alignItems: "center",
            background: "linear-gradient(180deg, #fffdfa 0%, #f8f2e8 100%)",
            border: "1px solid #e7dccd",
            borderRadius: uiRadius.pill,
            boxShadow:
              "0 14px 28px rgba(116, 94, 62, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
            color: uiColors.textStrong,
            cursor: "pointer",
            display: "flex",
            fontSize: "14px",
            fontWeight: 700,
            gap: uiSpacing.sm,
            justifyContent: "space-between",
            padding: `${uiSpacing.lg} ${uiSpacing.xl}`,
            transform: "translateY(-1px)",
            width: "100%",
          }}
          type="button"
        >
          <span>{`여기 ${currentDongName} 근데`}</span>
          <span
            style={{
              alignItems: "center",
              background: "rgba(255, 255, 255, 0.96)",
              border: `1px solid ${uiColors.border}`,
              borderRadius: "999px",
              display: "inline-flex",
              height: "30px",
              justifyContent: "center",
              padding: "0 8px",
              width: "30px",
            }}
          >
            <Image alt="" src={penWritingImage} width={15} height={15} />
          </span>
        </button>
      </header>

      <div
        style={{
          background: uiColors.surface,
          display: "flex",
          flex: 1,
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            background: uiColors.surface,
            display: "flex",
            flexDirection: "column",
            gap: uiSpacing.md,
            minHeight: 0,
            overflowY: "auto",
            padding: `${uiSpacing.lg} ${uiSpacing.pageX} ${uiSpacing.xxxl}`,
            position: "relative",
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
                position: "absolute",
                zIndex: 1,
              }}
              type="button"
            />
          ) : null}

          {state.loading ? <LoadingState label="목록을 불러오는 중" /> : null}
          {state.errorMessage ? <ErrorState message={state.errorMessage} /> : null}
          {state.empty ? (
            <EmptyState
              title="아직 이 동네 첫 글이 없어요"
              description="지금 있는 곳의 첫 번째 이야기를 남겨 보세요."
            />
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: uiSpacing.md,
              }}
            >
              {state.items.map((item) => (
                <PostListItem
                  key={item.id}
                  {...item}
                  isMenuOpen={item.id === activeMenuPostId}
                  onCloseMenu={onCloseMenu}
                  onOpenMenu={onOpenMenu}
                  onSelectReport={onSelectReport}
                  onToggleAgree={onToggleAgree}
                />
              ))}
              {state.loadingMore ? <LoadingState label="더 불러오는 중" /> : null}
            </div>
          )}
        </div>
      </div>

      {activeReportPost ? (
        <div
          onClick={reportSubmitting ? undefined : onCloseReportDialog}
          style={{
            alignItems: "center",
            background: "rgba(17, 24, 39, 0.28)",
            display: "flex",
            inset: 0,
            justifyContent: "center",
            padding: uiSpacing.pageX,
            position: "absolute",
            zIndex: 30,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              background: uiColors.surface,
              border: `1px solid ${uiColors.border}`,
              borderRadius: "22px",
              boxShadow: "0 12px 28px rgba(17, 24, 39, 0.14)",
              display: "flex",
              flexDirection: "column",
              gap: uiSpacing.xl,
              maxWidth: "320px",
              padding: `${uiSpacing.xl} ${uiSpacing.xl}`,
              width: "100%",
            }}
          >
            <h2
              style={{
                color: uiColors.textStrong,
                fontSize: "15px",
                fontWeight: 600,
                lineHeight: 1.4,
                margin: 0,
                textAlign: "center",
              }}
            >
              이 글을 신고할까요?
            </h2>

            <div
              style={{
                display: "flex",
                gap: uiSpacing.sm,
              }}
            >
              <button
                disabled={reportSubmitting}
                onClick={onCloseReportDialog}
                style={{
                  appearance: "none",
                  background: "#f3f5f7",
                  border: "1px solid rgba(17, 24, 39, 0.08)",
                  borderRadius: uiRadius.pill,
                  color: uiColors.textStrong,
                  cursor: reportSubmitting ? "default" : "pointer",
                  flex: 1,
                  fontSize: "14px",
                  fontWeight: 600,
                  padding: `${uiSpacing.md} ${uiSpacing.lg}`,
                }}
                type="button"
              >
                취소
              </button>
              <button
                disabled={reportSubmitting}
                onClick={onConfirmReport}
                style={{
                  appearance: "none",
                  background: "#f3f5f7",
                  border: "1px solid rgba(17, 24, 39, 0.08)",
                  borderRadius: uiRadius.pill,
                  color: uiColors.textStrong,
                  cursor: reportSubmitting ? "default" : "pointer",
                  flex: 1,
                  fontSize: "14px",
                  fontWeight: 600,
                  padding: `${uiSpacing.md} ${uiSpacing.lg}`,
                }}
                type="button"
              >
                {reportSubmitting ? "처리 중..." : "신고"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
