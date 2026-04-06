"use client";

import { DongPostsScreen } from "../../../components/home/dong-posts-screen";
import { getMockPostListState } from "../../../lib/posts/mock-data";

export default function FloatingUpdateButtonPreviewPage() {
  return (
    <div
      style={{
        height: "100dvh",
        margin: "0 auto",
        maxWidth: "420px",
        overflow: "hidden",
      }}
    >
      <DongPostsScreen
        currentDongName="삼성1동"
        onApplyPendingUpdates={() => undefined}
        onCompose={() => undefined}
        onLoadMore={() => undefined}
        onOpenMenu={() => undefined}
        onSelectReport={() => undefined}
        onToggleAgree={() => undefined}
        pendingNewItemsCount={3}
        runtimeNotice={null}
        state={getMockPostListState()}
      />
    </div>
  );
}
