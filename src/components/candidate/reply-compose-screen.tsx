"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { uiColors, uiSpacing } from "../../lib/ui/tokens";
import { CandidateReplyConfirmDialog } from "./candidate-reply-confirm-dialog";
import { CandidateReplyForm } from "./candidate-reply-form";
import { useCandidateReplyCompose } from "./use-candidate-reply-compose";

type ReplyComposeScreenProps = {
  postId: string;
  postContent: string;
  postDongName: string;
  postCreatedAt: string;
  candidateName: string;
};

export function ReplyComposeScreen({
  postId,
  postContent,
  postDongName,
  postCreatedAt,
  candidateName,
}: ReplyComposeScreenProps) {
  const replyCompose = useCandidateReplyCompose({ postId });

  return (
    <div
      style={{
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        width: "100%",
      }}
    >
      <header
        style={{
          alignItems: "center",
          borderBottom: `1px solid ${uiColors.border}`,
          display: "flex",
          gap: uiSpacing.sm,
          padding: `${uiSpacing.lg} ${uiSpacing.pageX}`,
          paddingTop: `calc(${uiSpacing.lg} + env(safe-area-inset-top, 0px))`,
        }}
      >
        <Link
          href="/candidate/dashboard"
          style={{ color: uiColors.textStrong, display: "flex" }}
        >
          <ArrowLeft size={20} />
        </Link>
        <h1
          style={{
            color: uiColors.textStrong,
            fontSize: "16px",
            fontWeight: 700,
            margin: 0,
          }}
        >
          답변 작성
        </h1>
      </header>

      <CandidateReplyForm
        candidateName={candidateName}
        postContent={postContent}
        postCreatedAt={postCreatedAt}
        postDongName={postDongName}
        content={replyCompose.content}
        customDeadline={replyCompose.customDeadline}
        error={replyCompose.error}
        isPromise={replyCompose.isPromise}
        promiseDeadline={replyCompose.promiseDeadline}
        charCount={replyCompose.charCount}
        submitDisabled={replyCompose.submitDisabled}
        onChangeContent={replyCompose.setContent}
        onChangeCustomDeadline={replyCompose.setCustomDeadline}
        onChangeIsPromise={replyCompose.setIsPromise}
        onChangePromiseDeadline={replyCompose.setPromiseDeadline}
        onOpenConfirm={replyCompose.openConfirm}
      />

      {replyCompose.showConfirm ? (
        <CandidateReplyConfirmDialog
          isPromise={replyCompose.isPromise}
          submitting={replyCompose.submitting}
          onCancel={replyCompose.closeConfirm}
          onConfirm={replyCompose.handleConfirmSubmit}
        />
      ) : null}
    </div>
  );
}
