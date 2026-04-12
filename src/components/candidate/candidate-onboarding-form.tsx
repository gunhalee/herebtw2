"use client";

import { uiColors, uiRadius, uiSpacing, uiTypography } from "../../lib/ui/tokens";

type CandidateOnboardingFormProps = {
  candidateName: string;
  district: string;
  content: string;
  charCount: number;
  error: string | null;
  submitting: boolean;
  submitDisabled: boolean;
  onChangeContent: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
};

export function CandidateOnboardingForm({
  candidateName,
  district,
  content,
  charCount,
  error,
  submitting,
  submitDisabled,
  onChangeContent,
  onSubmit,
}: CandidateOnboardingFormProps) {
  return (
    <form
      onSubmit={(event) => void onSubmit(event)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: uiSpacing.md,
      }}
    >
      <div style={{ position: "relative" }}>
        <textarea
          value={content}
          onChange={(event) => onChangeContent(event.target.value)}
          maxLength={100}
          placeholder={`"${district} 주민 여러분, 여러분의 이야기를 잘 듣겠습니다."`}
          style={{
            appearance: "none",
            background: uiColors.surfaceMuted,
            border: `1px solid ${uiColors.border}`,
            borderRadius: uiRadius.md,
            color: uiColors.textStrong,
            fontSize: "16px",
            height: 140,
            lineHeight: 1.55,
            outline: "none",
            padding: `${uiSpacing.lg} ${uiSpacing.lg} calc(${uiSpacing.lg} + 20px)`,
            resize: "none",
            width: "100%",
          }}
        />
        <span
          style={{
            bottom: uiSpacing.sm,
            color: uiColors.textMuted,
            fontSize: uiTypography.meta.fontSize,
            position: "absolute",
            right: uiSpacing.md,
          }}
        >
          {charCount}/100
        </span>
      </div>

      {error ? (
        <p style={{ color: uiColors.danger, fontSize: "13px", margin: 0 }}>
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitDisabled}
        style={{
          appearance: "none",
          background: uiColors.buttonPrimary,
          border: "none",
          borderRadius: uiRadius.md,
          color: "#ffffff",
          cursor: submitDisabled ? "default" : "pointer",
          fontSize: "15px",
          fontWeight: 700,
          opacity: submitDisabled ? 0.6 : 1,
          padding: "14px",
          width: "100%",
        }}
      >
        {submitting ? "등록 중..." : `${candidateName} 후보 첫 메시지 등록`}
      </button>
    </form>
  );
}
