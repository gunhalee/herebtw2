"use client";

import {
  useEffect,
  useRef,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import { createJsonPostRequestInit, fetchClientApiData } from "../../lib/api/client";
import { ensureRegisteredBrowserDevice } from "../../lib/device/browser-device";
import type { PostComposeState, PostLocation } from "../../types/post";

type ComposeSuccessResult = {
  publicUuid: string;
  dongName: string;
};

type UseComposeSubmitParams = {
  composeState: PostComposeState;
  dataSourceMode: "supabase" | "mock";
  locationReadyForSubmit: boolean;
  locationResolutionToken: string | null;
  notificationEmail: string;
  onDismiss?: () => void;
  onSuccess?: (result: ComposeSuccessResult) => void | Promise<void>;
  setComposeState: Dispatch<SetStateAction<PostComposeState>>;
  submitLocation: PostLocation | null;
};

export function useComposeSubmit({
  composeState,
  dataSourceMode,
  locationReadyForSubmit,
  locationResolutionToken,
  notificationEmail,
  onDismiss,
  onSuccess,
  setComposeState,
  submitLocation,
}: UseComposeSubmitParams) {
  const deviceRegistrationPromiseRef = useRef<Promise<string> | null>(null);

  function ensureDeviceRegistrationStarted() {
    if (!deviceRegistrationPromiseRef.current) {
      deviceRegistrationPromiseRef.current = ensureRegisteredBrowserDevice().catch(
        (error) => {
          deviceRegistrationPromiseRef.current = null;
          throw error;
        },
      );
    }

    return deviceRegistrationPromiseRef.current;
  }

  useEffect(() => {
    if (dataSourceMode !== "supabase") {
      return;
    }

    void ensureDeviceRegistrationStarted().catch(() => undefined);
  }, [dataSourceMode]);

  function handleChangeContent(value: string) {
    setComposeState((current) => ({
      ...current,
      content: value,
      charCount: value.trim().length,
      duplicateBlocked: false,
      errorMessage: null,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (dataSourceMode !== "supabase") {
      setComposeState((current) => ({
        ...current,
        errorMessage: "실시간으로 글을 등록하려면 Supabase 연결이 필요해요.",
      }));
      return;
    }

    if (!submitLocation || !locationReadyForSubmit) {
      setComposeState((current) => ({
        ...current,
        errorMessage: "현재 위치 확인이 끝난 뒤에 글을 등록할 수 있어요.",
      }));
      return;
    }

    setComposeState((current) => ({
      ...current,
      submitting: true,
      errorMessage: null,
    }));

    try {
      const anonymousDeviceId = await ensureDeviceRegistrationStarted();
      const trimmedEmail = notificationEmail.trim();
      const response = await fetchClientApiData<{
        post: {
          id: string;
          publicUuid: string;
          administrativeDongName: string;
        };
      }>({
        errorMessage: "글을 등록하지 못했어요.",
        init: createJsonPostRequestInit({
          anonymousDeviceId,
          content: composeState.content,
          location: {
            latitude: submitLocation.latitude,
            longitude: submitLocation.longitude,
          },
          locationResolutionToken,
          ...(trimmedEmail ? { notificationEmail: trimmedEmail } : {}),
        }),
        path: "/api/posts",
        timeoutErrorMessage: "글 등록이 지연되고 있어요. 다시 시도해 주세요.",
      });

      if (onSuccess) {
        onSuccess({
          publicUuid: response.post.publicUuid,
          dongName: response.post.administrativeDongName,
        });
        return;
      }

      setComposeState((current) => ({
        ...current,
        submitting: false,
      }));
      onDismiss?.();
    } catch (error) {
      setComposeState((current) => ({
        ...current,
        submitting: false,
        errorMessage:
          error instanceof Error ? error.message : "글을 등록하지 못했어요.",
      }));
    }
  }

  return {
    handleChangeContent,
    handleSubmit,
    submitDisabled:
      dataSourceMode !== "supabase" ||
      composeState.submitting ||
      !locationReadyForSubmit ||
      composeState.charCount < 1 ||
      composeState.charCount > 100,
  };
}
