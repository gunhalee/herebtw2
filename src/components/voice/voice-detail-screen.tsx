"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { DongPostsHeader } from "../home/dong-posts-header";
import { uiBrandYellow, uiRadius, uiSpacing } from "../../lib/ui/tokens";
import { saveCardImageFromBrowser } from "../../lib/card/browser-image-download";

type VoicePost = {
  id: string;
  publicUuid: string;
  content: string;
  administrativeDongName: string;
  createdAt: string;
  replyStatus: "delivered" | "replied";
  agreeCount: number;
  reply?: {
    candidateName: string;
    content: string;
    isPromise: boolean;
    promiseDeadline: string | null;
    createdAt: string;
  };
};

type VoiceDetailScreenProps = {
  post: VoicePost;
};

export function VoiceDetailScreen({ post }: VoiceDetailScreenProps) {
  const titleLineRef = useRef<HTMLHeadingElement>(null);
  const [titleTextWidthPx, setTitleTextWidthPx] = useState<number | null>(null);
  const [savingCardImage, setSavingCardImage] = useState(false);
  const cardImageUrl = `/api/card/${post.publicUuid}?type=voter`;

  useLayoutEffect(() => {
    const el = titleLineRef.current;
    if (!el || typeof ResizeObserver === "undefined") {
      return;
    }

    const update = () => {
      setTitleTextWidthPx(Math.ceil(el.getBoundingClientRect().width));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const columnStyle =
    titleTextWidthPx != null
      ? {
          boxSizing: "border-box" as const,
          marginLeft: "auto",
          marginRight: "auto",
          maxWidth: "100%",
          width: `${titleTextWidthPx}px`,
        }
      : {
          boxSizing: "border-box" as const,
          marginLeft: "auto",
          marginRight: "auto",
          maxWidth: "100%",
          width: "100%",
        };

  async function handleDownloadCardImage() {
    if (savingCardImage) {
      return;
    }

    setSavingCardImage(true);
    try {
      await saveCardImageFromBrowser({
        fileName: `voice-${post.publicUuid}.png`,
        imageUrl: cardImageUrl,
      });
    } finally {
      setSavingCardImage(false);
    }
  }

  return (
    <div
      style={{
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        width: "100%",
      }}
    >
      <DongPostsHeader
        animateComposeDongPlaceholder={false}
        currentDongName={post.administrativeDongName}
        shrinkTitleToIntrinsicWidth
        titleLineRef={titleLineRef}
      />

      <div
        style={{
          boxSizing: "border-box",
          display: "flex",
          flex: 1,
          flexDirection: "column",
          padding: `0 ${uiSpacing.pageX}`,
          width: "100%",
        }}
      >
        <div style={columnStyle}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: uiSpacing.xl,
              paddingTop: uiSpacing.xxl,
            }}
          >
            <div
              style={{
                background: "#ffffff",
                border: `1px solid ${uiBrandYellow.borderSoft}`,
                borderRadius: uiRadius.lg,
                boxShadow: "0 10px 24px rgba(17, 24, 39, 0.08)",
                overflow: "hidden",
                width: "100%",
              }}
            >
              <img
                alt="포토카드"
                src={cardImageUrl}
                style={{
                  display: "block",
                  height: "auto",
                  width: "100%",
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: uiSpacing.sm,
              paddingBottom: uiSpacing.xxl,
              paddingTop: uiSpacing.xl,
            }}
          >
            <button
              onClick={handleDownloadCardImage}
              type="button"
              disabled={savingCardImage}
              style={{
                alignItems: "center",
                appearance: "none",
                background: uiBrandYellow.ctaGradient,
                border: `1px solid ${uiBrandYellow.ctaBorder}`,
                borderRadius: uiRadius.md,
                boxShadow:
                  "0 8px 18px rgba(116, 94, 62, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.85)",
                color: "#000000",
                cursor: savingCardImage ? "wait" : "pointer",
                display: "flex",
                fontSize: "14px",
                fontWeight: 600,
                gap: uiSpacing.xs,
                justifyContent: "center",
                opacity: savingCardImage ? 0.8 : 1,
                padding: `14px ${uiSpacing.xl}`,
                width: "100%",
              }}
            >
              <Download color="#000000" size={16} strokeWidth={2.25} />
              {savingCardImage ? "이미지 준비 중..." : "포토카드 다운로드"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
