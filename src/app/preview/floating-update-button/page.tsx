"use client";

import { useState } from "react";
import { DongPostsScreen } from "../../../components/home/dong-posts-screen";
import { getMockPostListState } from "../../../lib/posts/mock-data";

export default function FloatingUpdateButtonPreviewPage() {
  const [state, setState] = useState(() => getMockPostListState());
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [activeReportPostId, setActiveReportPostId] = useState<string | null>(null);

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
        activeMenuPostId={activeMenuPostId}
        activeReportPostId={activeReportPostId}
        currentDongName="삼성1동"
        onApplyPendingUpdates={() => undefined}
        onCloseMenu={() => setActiveMenuPostId(null)}
        onCloseReportDialog={() => setActiveReportPostId(null)}
        onCompose={() => undefined}
        onConfirmReport={() => {
          if (!activeReportPostId) {
            return;
          }

          setState((current) => ({
            ...current,
            items: current.items.map((item) =>
              item.id === activeReportPostId
                ? {
                    ...item,
                    canReport: false,
                  }
                : item,
            ),
          }));
          setActiveReportPostId(null);
        }}
        onLoadMore={() => undefined}
        onOpenMenu={(postId) =>
          setActiveMenuPostId((current) => (current === postId ? null : postId))
        }
        onSelectReport={(postId) => {
          setActiveReportPostId(postId);
          setActiveMenuPostId(null);
        }}
        onToggleAgree={() => undefined}
        pendingNewItemsCount={3}
        runtimeNotice={null}
        state={state}
      />
    </div>
  );
}
