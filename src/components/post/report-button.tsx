"use client";

import {
  uiColors,
  uiRadius,
  uiSpacing,
  uiTypography,
} from "../../lib/ui/tokens";

export type ReportButtonProps = {
  disabled?: boolean;
  onClick?: () => void;
};

export function ReportButton({
  disabled = false,
  onClick,
}: ReportButtonProps) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        background: uiColors.surfaceMuted,
        border: `1px solid ${uiColors.border}`,
        borderRadius: uiRadius.pill,
        color: disabled ? uiColors.textMuted : uiColors.textStrong,
        cursor: disabled ? "default" : "pointer",
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
      신고
      </span>
    </button>
  );
}
