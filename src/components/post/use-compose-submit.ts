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
    void ensureDeviceRegistrationStarted().catch(() => undefined);
  }, []);

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

    if (!submitLocation || !locationReadyForSubmit) {
      setComposeState((current) => ({
        ...current,
        errorMessage: "?꾩옱 ?꾩튂 ?뺤씤???앸궃 ?ㅼ뿉 湲???깅줉?????덉뼱??",
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
        errorMessage: "湲???깅줉?섏? 紐삵뻽?댁슂.",
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
        timeoutErrorMessage: "湲 ?깅줉??吏?곕릺怨??덉뼱?? ?ㅼ떆 ?쒕룄??二쇱꽭??",
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
          error instanceof Error ? error.message : "湲???깅줉?섏? 紐삵뻽?댁슂.",
      }));
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
