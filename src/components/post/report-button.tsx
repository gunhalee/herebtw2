"use client";

import {
  uiColors,
  uiRadius,
  uiSpacing,
  uiTypography,
} from "../../lib/ui/tokens";

export type ReportButtonProps = {
  disabled?: boolean;
};

export function ReportButton({ disabled = false }: ReportButtonProps) {
  return (
    <button
      disabled={disabled}
      style={{
        background: uiColors.surfaceMuted,
        border: `1px solid ${uiColors.border}`,
        borderRadius: uiRadius.pill,
        color: disabled ? uiColors.textMuted : uiColors.textStrong,
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
