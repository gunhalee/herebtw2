"use client";

import {
  uiColors,
  uiRadius,
  uiSpacing,
  uiTypography,
} from "../../lib/ui/tokens";

export type DeletePostButtonProps = {
  canDelete?: boolean;
  deleteRemainingSeconds?: number;
};

export function DeletePostButton({
  canDelete = true,
  deleteRemainingSeconds = 180,
}: DeletePostButtonProps) {
  if (!canDelete) {
    return (
      <button
        disabled
        style={{
          background: uiColors.surfaceMuted,
          border: `1px solid ${uiColors.border}`,
          borderRadius: uiRadius.pill,
          color: uiColors.textMuted,
          display: "flex",
          justifyContent: "center",
          padding: `${uiSpacing.xs} ${uiSpacing.lg}`,
          width: "100%",
        }}
        type="button"
      >
        삭제 불가
      </button>
    );
  }

  const minutes = Math.floor(deleteRemainingSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (deleteRemainingSeconds % 60).toString().padStart(2, "0");

  return (
    <button
      style={{
        background: uiColors.dangerSoft,
        border: `1px solid ${uiColors.danger}`,
        borderRadius: uiRadius.pill,
        color: uiColors.danger,
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
      삭제 {minutes}:{seconds}
      </span>
    </button>
  );
}
