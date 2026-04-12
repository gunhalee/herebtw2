"use client";

import { useEffect, useState } from "react";
import { updateCandidateFirstMessage } from "./candidate-first-message-api";

export function useCandidateFirstMessageEditor(initialContent: string) {
  const [editingMessage, setEditingMessage] = useState(false);
  const [savedContent, setSavedContent] = useState(initialContent);
  const [messageContent, setMessageContent] = useState(initialContent);
  const [savingMessage, setSavingMessage] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);

  useEffect(() => {
    setSavedContent(initialContent);
    if (!editingMessage) {
      setMessageContent(initialContent);
    }
  }, [editingMessage, initialContent]);

  function startEditing() {
    setEditingMessage(true);
  }

  function handleChangeMessageContent(value: string) {
    setMessageContent(value);
    if (messageError) {
      setMessageError(null);
    }
  }

  async function handleSaveMessage() {
    const trimmed = messageContent.trim();

    if (trimmed.length < 1 || trimmed.length > 100) {
      setMessageError("100자 이내로 입력해주세요.");
      return;
    }

    setSavingMessage(true);
    setMessageError(null);

    try {
      await updateCandidateFirstMessage({
        content: trimmed,
      });
      setEditingMessage(false);
      setSavedContent(trimmed);
      setMessageContent(trimmed);
    } catch (error) {
      setMessageError(
        error instanceof Error
          ? error.message
          : "수정에 실패했습니다. 다시 시도해 주세요.",
      );
    } finally {
      setSavingMessage(false);
    }
  }

  function handleCancelEdit() {
    setMessageContent(savedContent);
    setMessageError(null);
    setEditingMessage(false);
  }

  return {
    editingMessage,
    messageContent,
    messageError,
    savingMessage,
    startEditing,
    handleChangeMessageContent,
    handleSaveMessage,
    handleCancelEdit,
  };
}
