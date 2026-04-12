"use client";

import { uiColors, uiRadius, uiSpacing, uiTypography } from "../../lib/ui/tokens";
import { formatRelativeTime } from "../../lib/utils/datetime";
import type { PromiseDeadlineOption } from "./candidate-reply-deadline";

type CandidateReplyFormProps = {
  candidateName: string;
  postContent: string;
  postCreatedAt: string;
  postDongName: string;
  content: string;
  customDeadline: string;
  error: string | null;
  isPromise: boolean;
  promiseDeadline: PromiseDeadlineOption;
  charCount: number;
  submitDisabled: boolean;
  onChangeContent: (value: string) => void;
  onChangeCustomDeadline: (value: string) => void;
  onChangeIsPromise: (checked: boolean) => void;
  onChangePromiseDeadline: (value: PromiseDeadlineOption) => void;
  onOpenConfirm: () => void;
};

export function CandidateReplyForm({
  candidateName,
  postContent,
  postCreatedAt,
  postDongName,
  content,
  customDeadline,
  error,
  isPromise,
  promiseDeadline,
  charCount,
  submitDisabled,
  onChangeContent,
  onChangeCustomDeadline,
  onChangeIsPromise,
  onChangePromiseDeadline,
  onOpenConfirm,
}: CandidateReplyFormProps) {
  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        gap: uiSpacing.xl,
        padding: `${uiSpacing.xxl} ${uiSpacing.pageX}`,
      }}
    >
      <div
        style={{
          background: uiColors.surfaceMuted,
          borderRadius: uiRadius.md,
          display: "flex",
          flexDirection: "column",
          gap: uiSpacing.xs,
          padding: uiSpacing.lg,
        }}
      >
        <p
          style={{
            color: uiColors.textStrong,
            fontSize: "15px",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {postContent}
        </p>
        <span
          style={{
            color: uiColors.textMuted,
            fontSize: uiTypography.meta.fontSize,
          }}
        >
          {postDongName} · {formatRelativeTime(postCreatedAt)}
        </span>
      </div>

      <div style={{ position: "relative" }}>
        <textarea
          value={content}
          onChange={(event) => onChangeContent(event.target.value)}
          maxLength={200}
          placeholder={`${candidateName} 후보로서 주민분께 짧게 답변을 남겨 주세요.`}
          style={{
            appearance: "none",
            background: "#ffffff",
            border: `1px solid ${uiColors.border}`,
            borderRadius: uiRadius.md,
            color: uiColors.textStrong,
            fontSize: "16px",
            height: 160,
            lineHeight: 1.55,
            outline: "none",
            padding: `${uiSpacing.lg} ${uiSpacing.lg} calc(${uiSpacing.lg} + 24px)`,
            resize: "none",
            width: "100%",
          }}
        />
        <span
          style={{
            bottom: uiSpacing.sm,
            color: charCount > 180 ? uiColors.danger : uiColors.textMuted,
            fontSize: uiTypography.meta.fontSize,
            position: "absolute",
            right: uiSpacing.md,
          }}
        >
          {charCount}/200
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: uiSpacing.sm,
        }}
      >
        <label
          style={{
            alignItems: "center",
            cursor: "pointer",
            display: "flex",
            gap: uiSpacing.sm,
          }}
        >
          <input
            type="checkbox"
            checked={isPromise}
            onChange={(event) => onChangeIsPromise(event.target.checked)}
            style={{
              accentColor: uiColors.buttonPrimary,
              height: 18,
              width: 18,
            }}
          />
          <span
            style={{
              color: uiColors.textStrong,
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            이 답변은 공약입니다.
          </span>
        </label>

        {isPromise ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: uiSpacing.xs,
              paddingLeft: "26px",
            }}
          >
            <select
              value={promiseDeadline}
              onChange={(event) =>
                onChangePromiseDeadline(event.target.value as PromiseDeadlineOption)
              }
              style={{
                appearance: "auto",
                background: uiColors.surfaceMuted,
                border: `1px solid ${uiColors.border}`,
                borderRadius: "8px",
                color: uiColors.textStrong,
                fontSize: "13px",
                padding: `${uiSpacing.sm} ${uiSpacing.md}`,
              }}
            >
              <option value="3months">당선 후 3개월</option>
              <option value="6months">당선 후 6개월</option>
              <option value="1year">당선 후 1년</option>
              <option value="custom">직접 입력</option>
            </select>
            {promiseDeadline === "custom" ? (
              <input
                type="date"
                value={customDeadline}
                onChange={(event) => onChangeCustomDeadline(event.target.value)}
                style={{
                  appearance: "auto",
                  background: uiColors.surfaceMuted,
                  border: `1px solid ${uiColors.border}`,
                  borderRadius: "8px",
                  color: uiColors.textStrong,
                  fontSize: "13px",
                  padding: `${uiSpacing.sm} ${uiSpacing.md}`,
                }}
              />
            ) : null}
          </div>
        ) : null}
      </div>

      {error ? (
        <p style={{ color: uiColors.danger, fontSize: "13px", margin: 0 }}>
          {error}
        </p>
      ) : null}

      <button
        onClick={onOpenConfirm}
        disabled={submitDisabled}
        type="button"
        style={{
          appearance: "none",
          background: uiColors.buttonPrimary,
          border: "none",
          borderRadius: uiRadius.md,
          color: "#ffffff",
          cursor: submitDisabled ? "default" : "pointer",
          fontSize: "15px",
          fontWeight: 700,
          marginTop: "auto",
          opacity: submitDisabled ? 0.5 : 1,
          padding: "14px",
          width: "100%",
        }}
      >
        답변 등록
      </button>
    </div>
  );
}
