"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createCandidateFirstMessage } from "./candidate-first-message-api";

export function useCandidateOnboarding() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charCount = content.trim().length;
  const submitDisabled = submitting || charCount < 1 || charCount > 100;

  function handleChangeContent(value: string) {
    setContent(value);
    if (error) {
      setError(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitDisabled) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createCandidateFirstMessage({
        content: content.trim(),
      });

      router.replace("/candidate/dashboard");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "첫 메시지를 등록하지 못했습니다. 다시 시도해 주세요.",
      );
      setSubmitting(false);
    }
  }

  return {
    content,
    submitting,
    error,
    charCount,
    submitDisabled,
    handleChangeContent,
    handleSubmit,
  };
}
