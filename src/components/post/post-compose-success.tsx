"use client";

import { useState } from "react";
import Image from "next/image";
import { Copy, Download } from "lucide-react";
import checkmarkIcon from "../checkmark.svg";
import {
  uiBrandYellow,
  uiColors,
  uiRadius,
  uiSpacing,
  uiTypography,
} from "../../lib/ui/tokens";
import { normalizeAdministrativeDongName } from "../../lib/geo/format-administrative-area";
import { saveCardImageFromBrowser } from "../../lib/card/browser-image-download";

const copyButtonSurface = {
  idle: {
    background: uiBrandYellow.surfaceSoft,
    border: uiBrandYellow.borderSoft,
    color: uiBrandYellow.textOnCta,
  },
  done: {
    background: uiBrandYellow.surfaceWarm,
    border: uiBrandYellow.borderWarm,
    color: uiBrandYellow.textOnCta,
  },
} as const;

/** viewBox 1:1 SVG — width·height 동일로만 그려 비율이 깨지지 않게 함 */
function CheckmarkIcon({ sizePx }: { sizePx: number }) {
  return (
    <span
      style={{
        alignItems: "center",
        display: "inline-flex",
        flexShrink: 0,
        height: sizePx,
        justifyContent: "center",
        lineHeight: 0,
        width: sizePx,
      }}
    >
      <Image
        alt=""
        height={sizePx}
        src={checkmarkIcon}
        width={sizePx}
        style={{
          display: "block",
          height: sizePx,
          maxHeight: sizePx,
          maxWidth: sizePx,
          objectFit: "contain",
          width: sizePx,
        }}
      />
    </span>
  );
}

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
  const [savingCardImage, setSavingCardImage] = useState(false);

  const voiceUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/v/${publicUuid}`
      : `/v/${publicUuid}`;
  const cardImageUrl = `/api/card/${publicUuid}?type=voter`;
  const displayDongName = normalizeAdministrativeDongName(dongName);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(voiceUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  }

  async function handleDownloadCardImage() {
    if (savingCardImage) {
      return;
    }

    setSavingCardImage(true);
    try {
      await saveCardImageFromBrowser({
        fileName: `voice-${publicUuid}.png`,
        imageUrl: cardImageUrl,
      });
    } finally {
      setSavingCardImage(false);
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
          paddingBottom: uiSpacing.xs,
          paddingTop: uiSpacing.md,
        }}
      >
        <CheckmarkIcon sizePx={56} />
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
          {`${displayDongName}에 남긴 목소리를 포토카드로 저장해보세요.`}
          <br />
          링크를 통해서 후보자의 답글을 확인할 수도 있어요.
        </p>
      </div>

      <button
        onClick={handleCopyLink}
        type="button"
        style={{
          alignItems: "center",
          appearance: "none",
          background: copied
            ? copyButtonSurface.done.background
            : copyButtonSurface.idle.background,
          border: `1px solid ${
            copied ? copyButtonSurface.done.border : copyButtonSurface.idle.border
          }`,
          borderRadius: uiRadius.md,
          color: copied
            ? copyButtonSurface.done.color
            : copyButtonSurface.idle.color,
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
            <CheckmarkIcon sizePx={18} />
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
        onClick={handleDownloadCardImage}
        type="button"
        disabled={savingCardImage}
        style={{
          alignItems: "center",
          appearance: "none",
          background: copyButtonSurface.idle.background,
          border: `1px solid ${copyButtonSurface.idle.border}`,
          borderRadius: uiRadius.md,
          color: copyButtonSurface.idle.color,
          cursor: savingCardImage ? "wait" : "pointer",
          display: "flex",
          fontSize: uiTypography.body.fontSize,
          fontWeight: 600,
          gap: uiSpacing.xs,
          justifyContent: "center",
          padding: `${uiSpacing.md} ${uiSpacing.xl}`,
          opacity: savingCardImage ? 0.8 : 1,
          transition: "all 150ms ease",
          width: "100%",
          maxWidth: 320,
        }}
      >
        <Download size={16} />
        {savingCardImage ? "이미지 준비 중..." : "포토카드 다운로드"}
      </button>

      <button
        onClick={onDismiss}
        type="button"
        style={{
          appearance: "none",
          background: uiColors.buttonPrimary,
          border: "none",
          borderRadius: uiRadius.md,
          color: uiColors.textInverse,
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
