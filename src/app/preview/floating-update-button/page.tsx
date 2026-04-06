"use client";

import { useState } from "react";
import { DongPostsScreen } from "../../../components/home/dong-posts-screen";
import { getMockPostListState } from "../../../lib/posts/mock-data";

const PREVIEW_DONG_NAME = "\uC6D4\uC1311\uB3D9";
const REPORT_SUCCESS_MESSAGE = "\uC2E0\uACE0\uAC00 \uC811\uC218\uB418\uC5C8\uC5B4\uC694.";

export default function FloatingUpdateButtonPreviewPage() {
  const [state, setState] = useState(() => getMockPostListState());
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [activeReportPostId, setActiveReportPostId] = useState<string | null>(null);
  const [reportSuccessMessage, setReportSuccessMessage] = useState<string | null>(null);
  const [reportSuccessPostId, setReportSuccessPostId] = useState<string | null>(null);

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
        currentDongName={PREVIEW_DONG_NAME}
        onApplyPendingUpdates={() => undefined}
        onCloseMenu={() => setActiveMenuPostId(null)}
        onCloseReportDialog={() => setActiveReportPostId(null)}
        onCloseReportSuccessDialog={() => {
          if (reportSuccessPostId) {
            setState((current) => ({
              ...current,
              items: current.items.filter((item) => item.id !== reportSuccessPostId),
            }));
          }

          setReportSuccessPostId(null);
          setReportSuccessMessage(null);
        }}
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
          setReportSuccessPostId(activeReportPostId);
          setReportSuccessMessage(REPORT_SUCCESS_MESSAGE);
          setActiveReportPostId(null);
        }}
        onLoadMore={() => undefined}
        onOpenMenu={(postId) =>
          setActiveMenuPostId((current) => (current === postId ? null : postId))
        }
        onSelectReport={(postId) => {
          setReportSuccessPostId(null);
          setReportSuccessMessage(null);
          setActiveReportPostId(postId);
          setActiveMenuPostId(null);
        }}
        onToggleAgree={() => undefined}
        pendingNewItemsCount={3}
        reportSuccessMessage={reportSuccessMessage}
        runtimeNotice={null}
        state={state}
      />
    </div>
  );
}
