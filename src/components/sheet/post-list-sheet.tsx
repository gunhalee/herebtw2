"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EmptyState } from "../common/empty-state";
import { ErrorState } from "../common/error-state";
import { LoadingState } from "../common/loading-state";
import type { PostListState } from "../../types/post";
import { PostListItem } from "./post-list-item";
import {
  uiColors,
  uiRadius,
  uiShadow,
  uiSpacing,
  uiTypography,
} from "../../lib/ui/tokens";

export type PostListSheetProps = {
  state: PostListState;
  onOpenItem?: (postId: string) => void;
  onProgressChange?: (progress: number) => void;
};

export function PostListSheet({
  state,
  onOpenItem,
  onProgressChange,
}: PostListSheetProps) {
  const [viewportHeight, setViewportHeight] = useState(800);
  const [sheetHeight, setSheetHeight] = useState(316);
  const [isDragging, setIsDragging] = useState(false);
  const bodyScrollRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    startY: number;
    startHeight: number;
    source: "header" | "body";
  } | null>(null);

  useEffect(() => {
    function updateViewportHeight() {
      const nextViewportHeight = window.innerHeight;
      setViewportHeight(nextViewportHeight);
      setSheetHeight((current) => {
        const collapsed = Math.min(316, Math.max(248, nextViewportHeight * 0.31));
        const expanded = Math.max(452, nextViewportHeight - 48);
        return Math.max(collapsed, Math.min(current || collapsed, expanded));
      });
    }

    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight);

    return () => {
      window.removeEventListener("resize", updateViewportHeight);
    };
  }, []);

  const snapPoints = useMemo(() => {
    const collapsed = Math.min(316, Math.max(248, viewportHeight * 0.31));
    const mid = Math.min(540, Math.max(404, viewportHeight * 0.62));
    const expanded = Math.max(452, viewportHeight - 48);

    return {
      collapsed,
      mid,
      expanded,
    };
  }, [viewportHeight]);

  useEffect(() => {
    const denominator = Math.max(1, snapPoints.expanded - snapPoints.collapsed);
    const progress = Math.max(
      0,
      Math.min(1, (sheetHeight - snapPoints.collapsed) / denominator),
    );
    onProgressChange?.(progress);
  }, [onProgressChange, sheetHeight, snapPoints.collapsed, snapPoints.expanded]);

  function snapToClosest(targetHeight: number) {
    const points = Object.values(snapPoints);
    const closest = points.reduce((nearest, point) => {
      return Math.abs(point - targetHeight) < Math.abs(nearest - targetHeight)
        ? point
        : nearest;
    }, points[0]);

    setSheetHeight(closest);
  }

  function handlePointerDown(
    event: React.PointerEvent<HTMLElement>,
    source: "header" | "body" = "header",
  ) {
    if (source === "body" && (bodyScrollRef.current?.scrollTop ?? 0) > 0) {
      return;
    }

    dragRef.current = {
      startY: event.clientY,
      startHeight: sheetHeight,
      source,
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    if (!dragRef.current) {
      return;
    }

    const deltaY = dragRef.current.startY - event.clientY;
    if (dragRef.current.source === "body" && deltaY > 0) {
      return;
    }

    const nextHeight = dragRef.current.startHeight + deltaY;
    setSheetHeight(
      Math.max(snapPoints.collapsed, Math.min(nextHeight, snapPoints.expanded)),
    );
  }

  function finishDrag() {
    if (!dragRef.current) {
      return;
    }

    const lastHeight = sheetHeight;
    dragRef.current = null;
    setIsDragging(false);
    snapToClosest(lastHeight);
  }

  return (
    <section
      aria-label="post-list-sheet"
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      style={{
        background: uiColors.surfaceSheet,
        borderTopLeftRadius: "32px",
        borderTopRightRadius: "32px",
        bottom: 0,
        boxShadow: uiShadow.sheet,
        display: "flex",
        flexDirection: "column",
        gap: uiSpacing.lg,
        height: `${sheetHeight}px`,
        left: 0,
        overflow: "hidden",
        padding: `${uiSpacing.md} ${uiSpacing.xl} ${uiSpacing.xxxl}`,
        position: "absolute",
        right: 0,
        touchAction: "pan-y",
        transition: isDragging ? "none" : "height 220ms cubic-bezier(0.22, 1, 0.36, 1)",
        zIndex: 3,
      }}
    >
      <header
        onDoubleClick={() => snapToClosest(snapPoints.expanded)}
        onPointerDown={(event) => handlePointerDown(event, "header")}
        style={{
          cursor: "ns-resize",
          display: "flex",
          flexDirection: "column",
          gap: uiSpacing.xs,
          paddingBottom: uiSpacing.xs,
          touchAction: "none",
        }}
      >
        <div
          style={{
            background: "#d9d6d0",
            borderRadius: uiRadius.pill,
            boxShadow: "0 1px 0 rgba(255,255,255,0.7)",
            height: "6px",
            margin: "0 auto",
            width: "58px",
          }}
        />
        <div
          style={{
            alignItems: "baseline",
            color: uiColors.textStrong,
            display: "flex",
            justifyContent: "space-between",
            gap: uiSpacing.md,
          }}
        >
          <strong style={{ fontSize: "21px", lineHeight: 1.2 }}>근처 한마디</strong>
          <span style={{ color: uiColors.textMuted, fontSize: "13px" }}>
            반경 2km · {state.items.length}개
          </span>
        </div>
        <div
          style={{
            color: uiColors.textMuted,
            display: "flex",
            gap: uiSpacing.lg,
            overflowX: "auto",
            paddingBottom: uiSpacing.sm,
          }}
        >
          <span
            style={{
              borderBottom: `2px solid ${uiColors.textStrong}`,
              color: uiColors.textStrong,
              paddingBottom: uiSpacing.xs,
              whiteSpace: "nowrap",
            }}
          >
            거리순
          </span>
          <span style={{ whiteSpace: "nowrap" }}>많이 읽힌</span>
          <span style={{ whiteSpace: "nowrap" }}>정리된 답변</span>
        </div>
      </header>

      {state.loading ? <LoadingState label="목록을 불러오는 중" /> : null}
      {state.errorMessage ? <ErrorState message={state.errorMessage} /> : null}

      {state.empty ? (
        <EmptyState
          title="아직 이 지역의 목소리가 없어요"
          description="첫 번째 목소리를 남겨보세요."
        />
      ) : (
        <div
          ref={bodyScrollRef}
          onPointerDown={(event) => handlePointerDown(event, "body")}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: uiSpacing.md,
            minHeight: 0,
            overflowY: "auto",
            paddingBottom: uiSpacing.xs,
            touchAction: "pan-y",
          }}
        >
          {state.items.map((item) => (
            <PostListItem key={item.id} {...item} onOpen={onOpenItem} />
          ))}
          {state.loadingMore ? <LoadingState label="더 불러오는 중" /> : null}
        </div>
      )}
    </section>
  );
}
