"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createCandidateReply } from "./candidate-reply-api";
import {
  getPromiseDeadlineValue,
  type PromiseDeadlineOption,
} from "./candidate-reply-deadline";

type UseCandidateReplyComposeParams = {
  postId: string;
};

export function useCandidateReplyCompose({
  postId,
}: UseCandidateReplyComposeParams) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isPromise, setIsPromise] = useState(false);
  const [promiseDeadline, setPromiseDeadline] =
    useState<PromiseDeadlineOption>("6months");
  const [customDeadline, setCustomDeadline] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charCount = content.trim().length;
  const submitDisabled = charCount < 1 || charCount > 200;

  function openConfirm() {
    setShowConfirm(true);
  }

  function closeConfirm() {
    if (!submitting) {
      setShowConfirm(false);
    }
  }

  async function handleConfirmSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      await createCandidateReply({
        postId,
        content: content.trim(),
        isPromise,
        promiseDeadline: getPromiseDeadlineValue({
          isPromise,
          promiseDeadline,
          customDeadline,
        }),
      });

      router.replace("/candidate/dashboard");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "답변 등록에 실패했습니다.",
      );
      setShowConfirm(false);
      setSubmitting(false);
    }
  }

  return {
    content,
    isPromise,
    promiseDeadline,
    customDeadline,
    showConfirm,
    submitting,
    error,
    charCount,
    submitDisabled,
    setContent,
    setIsPromise,
    setPromiseDeadline,
    setCustomDeadline,
    openConfirm,
    closeConfirm,
    handleConfirmSubmit,
  };
}
