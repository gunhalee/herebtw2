"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { CandidateMessage } from "../../lib/candidates/messages";
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
import { CandidateMessageCard } from "./candidate-messages-view";

type CandidateRepliesScreenProps = {
  candidateId: string;
  candidateMessageCard?: CandidateMessage | null;
  candidateName: string;
  initialState: PostListState;
  layout?: "standalone" | "embedded";
  onBack?: () => void;
};

export function CandidateRepliesScreen({
  candidateId,
  candidateMessageCard = null,
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
        alignItems: "center",
        appearance: "none",
        background: "transparent",
        border: "none",
        color: uiColors.textStrong,
        cursor: "pointer",
        display: "inline-flex",
        fontSize: "13px",
        fontWeight: 600,
        gap: "2px",
        padding: 0,
        textDecoration: "none",
        width: "fit-content",
      }}
      type="button"
    >
      <ChevronLeft size={20} strokeWidth={2.25} />
      <span>{"\uB4A4\uB85C \uAC00\uAE30"}</span>
    </button>
  ) : (
    <Link
      href="/"
      style={{
        alignItems: "center",
        color: uiColors.textStrong,
        display: "inline-flex",
        fontSize: "13px",
        fontWeight: 600,
        gap: "2px",
        textDecoration: "none",
        width: "fit-content",
      }}
    >
      <ChevronLeft size={20} strokeWidth={2.25} />
      <span>{"\uB4A4\uB85C \uAC00\uAE30"}</span>
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
          gap: uiSpacing.lg,
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "grid",
            gap: uiSpacing.sm,
            gridTemplateColumns: "1fr auto 1fr",
          }}
        >
          <div style={{ justifySelf: "start" }}>{backControl}</div>
          <h1
            style={{
              color: uiColors.textStrong,
              fontSize: "20px",
              fontWeight: 700,
              lineHeight: 1.3,
              margin: 0,
              textAlign: "center",
            }}
          >
            {`${candidateName} \uD6C4\uBCF4 \uB2F5\uBCC0 \uBAA8\uC544\uBCF4\uAE30`}
          </h1>
          <div aria-hidden="true" />
        </div>

        {candidateMessageCard ? (
          <CandidateMessageCard candidate={candidateMessageCard} />
        ) : null}
      </header>

      <div
        aria-hidden="true"
        style={{
          borderBottom: `1px solid ${uiColors.border}`,
          marginLeft: `-${uiSpacing.pageX}`,
          marginRight: `-${uiSpacing.pageX}`,
        }}
      />

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
