"use client";

import { useState } from "react";
import { createPortal, flushSync } from "react-dom";
import type { PostComposeState } from "../../types/post";
import type { ManualAdministrativeLocationSelection } from "../../lib/geo/administrative-dong-search";
import { shouldShowComposeLocationChange } from "../../lib/geo/compose-location-presentation";
import { PostComposeForm } from "./post-compose-form";
import { PostComposeSheetShell } from "./post-compose-sheet-shell";
import { PostComposeSuccess } from "./post-compose-success";
import { useComposeLocation } from "./use-compose-location";
import { useComposeSheetLayout } from "./use-compose-sheet-layout";
import { useComposeSubmit } from "./use-compose-submit";

type ComposeSuccessData = {
  publicUuid: string;
  dongName: string;
  notificationVerificationRequired: boolean;
  publicationStatus: "published" | "under_review";
};

type PostComposeExperienceProps = {
  manualLocationSelection?: ManualAdministrativeLocationSelection | null;
  maximumAccuracyMeters?: number;
  onChangeLocation?: () => void;
  onDismiss?: () => void;
  onSuccess?: () => void | Promise<void>;
};

function createInitialComposeState(): PostComposeState {
  return {
    content: "",
    charCount: 0,
    submitting: false,
    duplicateBlocked: false,
    errorMessage: null,
  };
}

export function PostComposeExperience({
  manualLocationSelection,
  maximumAccuracyMeters,
  onChangeLocation,
  onDismiss,
  onSuccess,
}: PostComposeExperienceProps) {
  const [composeState, setComposeState] = useState(createInitialComposeState);
  const [notificationEmail, setNotificationEmail] = useState("");
  const [successData, setSuccessData] = useState<ComposeSuccessData | null>(null);
  const {
    locationAccuracyWarning,
    locationDisplayName,
    locationRefreshing,
    locationReadyForSubmit,
    locationResolutionToken,
    locationSource,
    retryLocation,
    submitLocation,
  } = useComposeLocation({
    manualLocationSelection,
    maximumAccuracyMeters,
    setComposeState,
  });
  const { sheetPortalReady, sheetViewportLayout } = useComposeSheetLayout({
    onDismiss,
  });
  const { handleChangeContent, handleSubmit, submitDisabled } = useComposeSubmit({
    composeState,
    locationReadyForSubmit,
    notificationEmail,
    onDismiss,
    onSuccess: (result) => {
      flushSync(() => {
        setSuccessData(result);
        setComposeState((current) => ({
          ...current,
          submitting: false,
        }));
      });

      if (onSuccess) {
        void Promise.resolve(onSuccess()).catch(() => undefined);
      }
    },
    locationResolutionToken,
    locationSource,
    setComposeState,
    submitLocation,
  });

  const sheetViewportAvailableHeight = Math.max(
    320,
    sheetViewportLayout.viewportHeight - 12,
  );
  const sheetPreferredHeight =
    sheetViewportLayout.keyboardInset > 0
      ? sheetViewportAvailableHeight
      : Math.min(
          460,
          Math.max(360, Math.round(sheetViewportLayout.viewportHeight * 0.52)),
        );
  const sheetHeight = Math.min(
    sheetPreferredHeight,
    sheetViewportAvailableHeight,
  );

  if (!sheetPortalReady || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <PostComposeSheetShell
      keyboardInset={sheetViewportLayout.keyboardInset}
      maxHeight={sheetViewportAvailableHeight}
      sheetHeight={sheetHeight}
      onDismiss={onDismiss}
    >
      {successData ? (
        <PostComposeSuccess
          publicUuid={successData.publicUuid}
          dongName={successData.dongName}
          notificationVerificationRequired={
            successData.notificationVerificationRequired
          }
          publicationStatus={successData.publicationStatus}
          onDismiss={() => onDismiss?.()}
        />
      ) : (
        <PostComposeForm
          composeState={composeState}
          locationAccuracyWarning={locationAccuracyWarning}
          locationDisplayName={locationDisplayName}
          locationRefreshing={locationRefreshing}
          notificationEmail={notificationEmail}
          submitDisabled={submitDisabled}
          onChangeContent={handleChangeContent}
          onChangeNotificationEmail={setNotificationEmail}
          onChangeLocation={
            shouldShowComposeLocationChange(locationSource)
              ? onChangeLocation
              : undefined
          }
          onDismiss={onDismiss}
          onRetryLocation={retryLocation}
          onSubmit={handleSubmit}
        />
      )}
    </PostComposeSheetShell>,
    document.body,
  );
}
