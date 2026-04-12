"use client";

import Link from "next/link";
import { useState } from "react";
import { DongPostsFeedContent } from "../home/dong-posts-feed-content";
import { fetchCandidateRepliesPage } from "./candidate-replies-api";
import {
  buildLoadingMorePostListState,
  buildPostListErrorState,
  buildReadyPostListState,
  mergePostItems,
} from "../home/home-feed-state";
import type { PostListState } from "../../types/post";
import { uiColors, uiSpacing } from "../../lib/ui/tokens";

type CandidateRepliesScreenProps = {
  candidateId: string;
  candidateName: string;
  initialState: PostListState;
  layout?: "standalone" | "embedded";
  onBack?: () => void;
};

export function CandidateRepliesScreen({
  candidateId,
  candidateName,
  initialState,
  layout = "standalone",
  onBack,
}: CandidateRepliesScreenProps) {
  const [postListState, setPostListState] = useState(initialState);
  const embedded = layout === "embedded";

  async function handleLoadMore() {
    if (
      postListState.loading ||
      postListState.loadingMore ||
      !postListState.nextCursor
    ) {
      return;
    }

    try {
      setPostListState((current) => buildLoadingMorePostListState(current));
      const result = await fetchCandidateRepliesPage(
        candidateId,
        postListState.nextCursor,
      );

      setPostListState((current) => {
        const mergedItems = mergePostItems(current.items, result.items);

        return buildReadyPostListState(current, {
          items: mergedItems,
          nextCursor: result.nextCursor,
          sort: "latest",
        });
      });
    } catch (error) {
      setPostListState((current) =>
        buildPostListErrorState(
          current,
          error instanceof Error
            ? error.message
            : "\uD6C4\uBCF4 \uB2F5\uBCC0 \uBAA9\uB85D\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
        ),
      );
    }
  }

  const backControl = embedded ? (
    <button
      onClick={onBack}
      style={{
        appearance: "none",
        background: "transparent",
        border: "none",
        color: uiColors.textMuted,
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: 600,
        padding: 0,
        textDecoration: "none",
        width: "fit-content",
      }}
      type="button"
    >
      {"\u2190 \uBA54\uC778 \uD53C\uB4DC\uB85C"}
    </button>
  ) : (
    <Link
      href="/"
      style={{
        color: uiColors.textMuted,
        fontSize: "13px",
        fontWeight: 600,
        textDecoration: "none",
        width: "fit-content",
      }}
    >
      {"\u2190 \uBA54\uC778 \uD53C\uB4DC\uB85C"}
    </Link>
  );

  const content = (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        gap: uiSpacing.md,
        minHeight: embedded ? undefined : "100dvh",
        padding: embedded
          ? "0"
          : `${uiSpacing.lg} ${uiSpacing.pageX} calc(108px + env(safe-area-inset-bottom, 0px))`,
      }}
    >
      <header
        style={{
          display: "flex",
          flexDirection: "column",
          gap: uiSpacing.md,
          ...(embedded
            ? {
                borderBottom: `1px solid ${uiColors.border}`,
                marginBottom: uiSpacing.sm,
                paddingBottom: uiSpacing.md,
              }
            : {}),
        }}
      >
        {backControl}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: uiSpacing.xs,
          }}
        >
          <h1
            style={{
              color: uiColors.textStrong,
              fontSize: "20px",
              fontWeight: 700,
              lineHeight: 1.3,
              margin: 0,
            }}
          >
            {`${candidateName} \uD6C4\uBCF4 \uB2F5\uBCC0 \uCE74\uB4DC`}
          </h1>
          <p
            style={{
              color: uiColors.textMuted,
              fontSize: "13px",
              margin: 0,
            }}
          >
            {"\uCD5C\uC2E0 \uB2F5\uBCC0\uC21C"}
          </p>
        </div>
      </header>

      {postListState.errorMessage && postListState.items.length > 0 ? (
        <p
          style={{
            color: "#dc2626",
            fontSize: "12px",
            margin: 0,
          }}
        >
          {postListState.errorMessage}
        </p>
      ) : null}

      <DongPostsFeedContent
        shouldObscurePosts={false}
        state={postListState}
        onLoadMore={handleLoadMore}
      />
    </section>
  );

  if (embedded) {
    return content;
  }

  return (
    <main
      style={{
        background: uiColors.surface,
        minHeight: "100dvh",
      }}
    >
      {content}
    </main>
  );
}
