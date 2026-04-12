"use client";

import type { FormEvent } from "react";
import { uiColors, uiSpacing, uiTypography } from "../../lib/ui/tokens";
import type { PostComposeState } from "../../types/post";

type PostComposeFormProps = {
  composeState: PostComposeState;
  notificationEmail: string;
  submitDisabled: boolean;
  onChangeContent: (value: string) => void;
  onChangeNotificationEmail: (value: string) => void;
  onDismiss?: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
};

export function PostComposeForm({
  composeState,
  notificationEmail,
  submitDisabled,
  onChangeContent,
  onChangeNotificationEmail,
  onDismiss,
  onSubmit,
}: PostComposeFormProps) {
  return (
    <form
      onSubmit={(event) => void onSubmit(event)}
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
          onChange={(event) => onChangeContent(event.target.value)}
          placeholder="지금 여기에 한마디 해주세요."
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
          후보자가 답변하면 알려드릴까요?
        </label>
        <input
          id="sheet-notification-email"
          type="email"
          placeholder="이메일 주소 (선택)"
          value={notificationEmail}
          onChange={(event) => onChangeNotificationEmail(event.target.value)}
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
          이메일은 답변 알림 용도로만 사용되며, 다른 목적으로 쓰지 않습니다.
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
          같은 내용의 글이 이미 있어요. 내용을 조금 수정한 뒤 다시 시도해 주세요.
        </p>
      ) : null}
    </form>
  );
}
