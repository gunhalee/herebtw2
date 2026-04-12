"use client";

import { useState } from "react";
import { createPortal, flushSync } from "react-dom";
import {
  uiColors,
  uiShadow,
  uiSpacing,
  uiTypography,
} from "../../lib/ui/tokens";
import type { PostComposeState } from "../../types/post";
import { PostComposeSuccess } from "./post-compose-success";
import { useComposeLocation } from "./use-compose-location";
import { useComposeSheetLayout } from "./use-compose-sheet-layout";
import { useComposeSubmit } from "./use-compose-submit";

type ComposeSuccessData = {
  publicUuid: string;
  dongName: string;
};

type PostComposeExperienceProps = {
  dataSourceMode: "supabase" | "mock";
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
  dataSourceMode,
  onDismiss,
  onSuccess,
}: PostComposeExperienceProps) {
  const [composeState, setComposeState] = useState(createInitialComposeState);
  const [notificationEmail, setNotificationEmail] = useState("");
  const [successData, setSuccessData] = useState<ComposeSuccessData | null>(null);
  const {
    locationReadyForSubmit,
    locationResolutionTokenPending,
    locationResolutionToken,
    submitLocation,
  } =
    useComposeLocation({
      setComposeState,
    });
  const { sheetPortalReady, sheetViewportLayout } = useComposeSheetLayout({
    onDismiss,
  });
  const { handleChangeContent, handleSubmit, submitDisabled } =
    useComposeSubmit({
      composeState,
      dataSourceMode,
      locationReadyForSubmit,
      locationResolutionTokenPending,
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

  const sheetOverlay = (
    <div
      aria-modal="true"
      className="compose-sheet-overlay"
      role="dialog"
    >
      <button
        aria-label="글쓰기 닫기"
        className="compose-sheet-overlay__backdrop"
        onClick={onDismiss}
        type="button"
      />
      <section
        className="compose-sheet-panel"
        style={{
          background: "#ffffff",
          borderTopLeftRadius: "28px",
          borderTopRightRadius: "28px",
          boxShadow: uiShadow.sheet,
          display: "flex",
          flexDirection: "column",
          height: `${sheetHeight}px`,
          marginBottom: `${sheetViewportLayout.keyboardInset}px`,
          maxHeight: `${sheetViewportAvailableHeight}px`,
          overflow: "hidden",
          padding: `${uiSpacing.md} ${uiSpacing.pageX} calc(${uiSpacing.lg} + env(safe-area-inset-bottom, 0px))`,
          position: "relative",
          width: "100%",
        }}
      >
        {successData ? (
          <PostComposeSuccess
            publicUuid={successData.publicUuid}
            dongName={successData.dongName}
            onDismiss={() => onDismiss?.()}
          />
        ) : (
        <form
          onSubmit={handleSubmit}
          style={{
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
            gap: uiSpacing.sm,
            height: "100%",
          }}
        >
          <div
            style={{
              alignItems: "center",
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              width: "100%",
            }}
          >
            <button
              onClick={onDismiss}
              style={{
                appearance: "none",
                background: "transparent",
                border: "none",
                color: uiColors.textMuted,
                cursor: "pointer",
                fontSize: "18px",
                fontWeight: 700,
                justifySelf: "start",
                minHeight: "40px",
                padding: `${uiSpacing.xs} ${uiSpacing.xs}`,
              }}
              type="button"
            >
              닫기
            </button>

            <div
              style={{
                justifySelf: "center",
                minWidth: 0,
              }}
            >
              <h2
                style={{
                  color: uiColors.textStrong,
                  fontSize: "18px",
                  lineHeight: 1.2,
                  margin: 0,
                  textAlign: "center",
                }}
              >
                여기 남기기
              </h2>
            </div>

            <button
              disabled={submitDisabled}
              style={{
                appearance: "none",
                background: "transparent",
                border: "none",
                color: submitDisabled ? "#9ca3af" : uiColors.buttonPrimary,
                cursor: submitDisabled ? "default" : "pointer",
                fontSize: "18px",
                fontWeight: 700,
                justifySelf: "end",
                minHeight: "40px",
                padding: `${uiSpacing.xs} ${uiSpacing.xs}`,
              }}
              type="submit"
            >
              {composeState.submitting ? "등록 중..." : "등록"}
            </button>
          </div>

          <div
            style={{
              alignSelf: "stretch",
              flex: 1,
              minHeight: 0,
              position: "relative",
            }}
          >
            <textarea
              id="sheet-post-content"
              maxLength={100}
              onChange={(event) => handleChangeContent(event.target.value)}
              placeholder="지금 여기에서 글을 남겨보세요."
              style={{
                background: "transparent",
                border: "none",
                color: uiColors.textStrong,
                fontSize: "20px",
                fontWeight: 500,
                height: "100%",
                lineHeight: 1.55,
                minHeight: 0,
                outline: "none",
                overscrollBehavior: "contain",
                overflowY: "auto",
                padding: `${uiSpacing.sm} 0 calc(${uiSpacing.xl} + 26px)`,
                resize: "none",
                verticalAlign: "top",
                WebkitOverflowScrolling: "touch",
                width: "100%",
              }}
              value={composeState.content}
            />
            <span
              style={{
                bottom: uiSpacing.sm,
                color: uiColors.textMuted,
                fontSize: uiTypography.meta.fontSize,
                fontWeight: uiTypography.meta.fontWeight,
                position: "absolute",
                right: 0,
                textAlign: "right",
              }}
            >
              {composeState.charCount}/100
            </span>
          </div>

          <div
            style={{
              alignSelf: "stretch",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <label
              htmlFor="sheet-notification-email"
              style={{
                color: uiColors.textMuted,
                fontSize: uiTypography.meta.fontSize,
                fontWeight: uiTypography.meta.fontWeight,
              }}
            >
              후보자가 답변을 달면 알려드릴까요?
            </label>
            <input
              id="sheet-notification-email"
              type="email"
              placeholder="이메일 주소 (선택)"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              style={{
                appearance: "none",
                background: uiColors.surfaceMuted,
                border: `1px solid ${uiColors.border}`,
                borderRadius: "10px",
                color: uiColors.textStrong,
                fontSize: "14px",
                outline: "none",
                padding: `${uiSpacing.sm} ${uiSpacing.md}`,
                width: "100%",
              }}
            />
            <p
              style={{
                color: uiColors.textMuted,
                fontSize: "10px",
                lineHeight: 1.4,
                margin: 0,
              }}
            >
              이메일은 답변 알림 용도로만 사용되며, 다른 목적으로 활용하지 않습니다.
            </p>
          </div>

          {composeState.errorMessage ? (
            <p
              style={{
                color: uiColors.danger,
                fontSize: uiTypography.meta.fontSize,
                margin: 0,
              }}
            >
              {composeState.errorMessage}
            </p>
          ) : null}

          {composeState.duplicateBlocked ? (
            <p
              style={{
                color: uiColors.danger,
                fontSize: uiTypography.meta.fontSize,
                margin: 0,
              }}
            >
              같은 내용의 글이 이미 있어요. 내용을 조금 수정해 다시 시도해주세요.
            </p>
          ) : null}

        </form>
        )}
      </section>
    </div>
  );

  if (!sheetPortalReady || typeof document === "undefined") {
    return null;
  }

  return createPortal(sheetOverlay, document.body);
}
