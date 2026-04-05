"use client";

import {
  uiColors,
  uiRadius,
  uiSpacing,
  uiTypography,
} from "../../lib/ui/tokens";

export type DownloadCardButtonProps = {
  disabled?: boolean;
};

export function DownloadCardButton({
  disabled = false,
}: DownloadCardButtonProps) {
  return (
    <button
      disabled={disabled}
      style={{
        background: uiColors.buttonPrimary,
        border: `1px solid ${uiColors.buttonPrimary}`,
        borderRadius: uiRadius.pill,
        color: uiColors.textInverse,
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
        이미지 카드 다운로드
      </span>
    </button>
  );
}
