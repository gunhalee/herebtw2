"use client";

import {
  useEffect,
  useRef,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import {
  ClientApiError,
  createIdempotentJsonPostRequestInit,
  fetchClientApiData,
} from "../../lib/api/client";
import { ensureRegisteredBrowserDevice } from "../../lib/device/browser-device";
import type { LocationSource } from "../../lib/geo/location-resolution-token";
import type { PostComposeState, PostLocation } from "../../types/post";

type ComposeSuccessResult = {
  publicUuid: string;
  dongName: string;
  notificationVerificationRequired: boolean;
};

type UseComposeSubmitParams = {
  composeState: PostComposeState;
  locationReadyForSubmit: boolean;
  locationResolutionToken: string | null;
  locationSource: LocationSource;
  notificationEmail: string;
  onDismiss?: () => void;
  onSuccess?: (result: ComposeSuccessResult) => void | Promise<void>;
  setComposeState: Dispatch<SetStateAction<PostComposeState>>;
  submitLocation: PostLocation | null;
};

export function useComposeSubmit({
  composeState,
  locationReadyForSubmit,
  locationResolutionToken,
  locationSource,
  notificationEmail,
  onDismiss,
  onSuccess,
  setComposeState,
  submitLocation,
}: UseComposeSubmitParams) {
  const deviceRegistrationPromiseRef = useRef<Promise<string> | null>(null);
  const clientRequestIdRef = useRef<string | null>(null);
  const submittingRef = useRef(false);

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
    void ensureDeviceRegistrationStarted().catch(() => undefined);
  }, []);

  function handleChangeContent(value: string) {
    clientRequestIdRef.current = null;
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

    if (submittingRef.current) {
      return;
    }

    if (!submitLocation || !locationReadyForSubmit) {
      setComposeState((current) => ({
        ...current,
        errorMessage: "위치 정보를 로드하고 있어요. 잠시만 기다려주세요.",
      }));
      return;
    }

    submittingRef.current = true;
    setComposeState((current) => ({
      ...current,
      submitting: true,
      errorMessage: null,
    }));

    try {
      const anonymousDeviceId = await ensureDeviceRegistrationStarted();
      const clientRequestId =
        clientRequestIdRef.current ??
        (typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (part) => {
              const random = Math.floor(Math.random() * 16);
              return (part === "x" ? random : (random & 0x3) | 0x8).toString(16);
            }));
      clientRequestIdRef.current = clientRequestId;
      const trimmedEmail = notificationEmail.trim();
      const response = await fetchClientApiData<{
        notificationVerificationRequired: boolean;
        post: {
          id: string;
          publicUuid: string;
          administrativeDongName: string;
        };
      }>({
        errorMessage: "죄송합니다. 저장을 실패하였습니다.",
        init: createIdempotentJsonPostRequestInit({
          anonymousDeviceId,
          clientRequestId,
          content: composeState.content,
          location: {
            latitude: submitLocation.latitude,
            longitude: submitLocation.longitude,
          },
          locationResolutionToken,
          locationSource,
          ...(trimmedEmail ? { notificationEmail: trimmedEmail } : {}),
        }, clientRequestId),
        path: "/api/posts",
        timeoutErrorMessage: "저장이 지연되고 있습니다. 잠시 후에 다시 시도해주세요.",
      });

      if (onSuccess) {
        await onSuccess({
          publicUuid: response.post.publicUuid,
          dongName: response.post.administrativeDongName,
          notificationVerificationRequired:
            response.notificationVerificationRequired,
        });
        clientRequestIdRef.current = null;
        return;
      }

      setComposeState((current) => ({
        ...current,
        submitting: false,
      }));
      clientRequestIdRef.current = null;
      onDismiss?.();
    } catch (error) {
      setComposeState((current) => ({
        ...current,
        submitting: false,
        duplicateBlocked:
          error instanceof ClientApiError && error.code === "DUPLICATE_CONTENT",
        errorMessage:
          error instanceof Error ? error.message : "죄송합니다. 저장을 실패하였습니다.",
      }));
    } finally {
      submittingRef.current = false;
    }
  }

  return {
    handleChangeContent,
    handleSubmit,
    submitDisabled:
      composeState.submitting ||
      !locationReadyForSubmit ||
      composeState.charCount < 1 ||
      composeState.charCount > 100,
  };
}
