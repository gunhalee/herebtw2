"use client";

import { useState } from "react";
import { Check, Copy, Link } from "lucide-react";
import {
  uiColors,
  uiRadius,
  uiSpacing,
  uiTypography,
} from "../../lib/ui/tokens";

type PostComposeSuccessProps = {
  publicUuid: string;
  dongName: string;
  onDismiss: () => void;
};

export function PostComposeSuccess({
  publicUuid,
  dongName,
  onDismiss,
}: PostComposeSuccessProps) {
  const [copied, setCopied] = useState(false);

  const voiceUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/v/${publicUuid}`
      : `/v/${publicUuid}`;

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(voiceUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  }

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
        gap: uiSpacing.xxl,
        justifyContent: "center",
        padding: `${uiSpacing.xxxl} ${uiSpacing.pageX}`,
        height: "100%",
      }}
    >
      <div
        style={{
          alignItems: "center",
          background: "#ecfdf5",
          borderRadius: "50%",
          display: "flex",
          height: 64,
          justifyContent: "center",
          width: 64,
        }}
      >
        <Check size={32} color="#059669" strokeWidth={2.5} />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: uiSpacing.xs,
          textAlign: "center",
        }}
      >
        <h2
          style={{
            color: uiColors.textStrong,
            fontSize: "20px",
            fontWeight: 700,
            lineHeight: 1.3,
            margin: 0,
          }}
        >
          당신의 목소리가 전달되었습니다
        </h2>
        <p
          style={{
            color: uiColors.textMuted,
            fontSize: uiTypography.body.fontSize,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {dongName}에 남긴 목소리를 아래 링크로 다시 확인할 수 있어요.
        </p>
      </div>

      <button
        onClick={handleCopyLink}
        type="button"
        style={{
          alignItems: "center",
          appearance: "none",
          background: copied ? "#ecfdf5" : uiColors.surfaceMuted,
          border: `1px solid ${copied ? "#a7f3d0" : uiColors.border}`,
          borderRadius: uiRadius.md,
          color: copied ? "#059669" : uiColors.textBody,
          cursor: "pointer",
          display: "flex",
          fontSize: uiTypography.body.fontSize,
          fontWeight: 600,
          gap: uiSpacing.xs,
          justifyContent: "center",
          padding: `${uiSpacing.md} ${uiSpacing.xl}`,
          width: "100%",
          maxWidth: 320,
          transition: "all 150ms ease",
        }}
      >
        {copied ? (
          <>
            <Check size={16} />
            복사됨
          </>
        ) : (
          <>
            <Copy size={16} />
            링크 복사하기
          </>
        )}
      </button>

      <button
        onClick={() => {
          window.open(voiceUrl, "_blank");
        }}
        type="button"
        style={{
          alignItems: "center",
          appearance: "none",
          background: "transparent",
          border: "none",
          color: uiColors.textMuted,
          cursor: "pointer",
          display: "flex",
          fontSize: uiTypography.meta.fontSize,
          gap: "4px",
          padding: uiSpacing.xs,
          textDecoration: "underline",
          textUnderlineOffset: "3px",
        }}
      >
        <Link size={12} />
        내 목소리 페이지 보기
      </button>

      <button
        onClick={onDismiss}
        type="button"
        style={{
          appearance: "none",
          background: uiColors.buttonPrimary,
          border: "none",
          borderRadius: uiRadius.md,
          color: "#ffffff",
          cursor: "pointer",
          fontSize: "15px",
          fontWeight: 700,
          padding: `14px ${uiSpacing.xl}`,
          width: "100%",
          maxWidth: 320,
        }}
      >
        닫기
      </button>
    </div>
  );
}
