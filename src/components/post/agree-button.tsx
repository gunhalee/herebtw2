"use client";

import {
  uiColors,
  uiRadius,
  uiSpacing,
  uiTypography,
} from "../../lib/ui/tokens";

export type AgreeButtonProps = {
  agreed?: boolean;
  agreeCount?: number;
  disabled?: boolean;
  onToggle?: () => void;
};

export function AgreeButton({
  agreed = false,
  agreeCount = 0,
  disabled = false,
  onToggle,
}: AgreeButtonProps) {
  return (
    <button
      aria-pressed={agreed}
      disabled={disabled}
      onClick={onToggle}
      style={{
        background: agreed ? uiColors.buttonPrimary : uiColors.surfaceMuted,
        border: agreed
          ? `1px solid ${uiColors.buttonPrimary}`
          : `1px solid ${uiColors.border}`,
        borderRadius: uiRadius.pill,
        color: agreed ? uiColors.textInverse : uiColors.textStrong,
        display: "flex",
        justifyContent: "center",
        padding: `${uiSpacing.xs} ${uiSpacing.lg}`,
        width: "100%",
      }}
      type="button"
    >
      <span
        style={{
          fontSize: uiTypography.body.fontSize,
          fontWeight: 600,
        }}
      >
        {agreed ? "맞아요 취소" : "맞아요"} ({agreeCount})
      </span>
    </button>
  );
}
