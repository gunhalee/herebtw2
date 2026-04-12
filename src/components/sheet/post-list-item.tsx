"use client";

import type { PostListItem as PostListItemModel } from "../../types/post";
import { uiSpacing } from "../../lib/ui/tokens";
import { PostListItemCard } from "./post-list-item-card";
import { PostListItemMenu } from "./post-list-item-menu";

type PostListItemProps = PostListItemModel;

export function PostListItem({
  id,
  content,
  administrativeDongName,
  distanceMeters,
  relativeTime,
  agreeCount,
  myAgree,
  isHighlighted,
  replyStatus,
  replyCandidateName,
  replyCandidatePhotoUrl,
  replyContent,
  replyIsPromise,
  isMenuOpen,
  onToggleAgree,
  onOpenMenu,
  onCloseMenu,
  onSelectReport,
}: PostListItemProps & {
  isMenuOpen?: boolean;
  onToggleAgree?: (postId: string) => void;
  onOpenMenu?: (postId: string) => void;
  onCloseMenu?: () => void;
  onSelectReport?: (postId: string) => void;
}) {
  return (
    <article
      data-highlighted={isHighlighted}
      style={{
        alignItems: "stretch",
        display: "flex",
        flexDirection: "column",
        gap: uiSpacing.xs,
        position: "relative",
        zIndex: isMenuOpen ? 2 : undefined,
      }}
    >
      <div
        style={{
          alignSelf: "stretch",
          paddingBottom: "10px",
          position: "relative",
          width: "100%",
        }}
      >
        <PostListItemCard
          menuPostId={id}
          agreeCount={agreeCount}
          administrativeDongName={administrativeDongName}
          content={content}
          distanceMeters={distanceMeters}
          isHighlighted={isHighlighted}
          isMenuOpen={isMenuOpen}
          myAgree={myAgree}
          relativeTime={relativeTime}
          replyStatus={replyStatus}
          replyCandidateName={replyCandidateName}
          replyCandidatePhotoUrl={replyCandidatePhotoUrl}
          replyContent={replyContent}
          replyIsPromise={replyIsPromise}
          onCloseMenu={onCloseMenu}
          onOpenMenu={() => onOpenMenu?.(id)}
          onToggleAgree={() => onToggleAgree?.(id)}
        />

        {isMenuOpen ? (
          <PostListItemMenu postId={id} onSelectReport={() => onSelectReport?.(id)} />
        ) : null}
      </div>
    </article>
  );
}
