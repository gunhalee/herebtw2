"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { CheckCircle, Download, MessageCircle } from "lucide-react";
import checkmarkIcon from "../checkmark.svg";
import { DongPostsHeader } from "../home/dong-posts-header";
import { formatAdministrativeAreaNameForHomeDisplay } from "../../lib/geo/format-administrative-area";
import {
  uiBrandYellow,
  uiColors,
  uiRadius,
  uiSpacing,
  uiTypography,
} from "../../lib/ui/tokens";
import { formatRelativeTime } from "../../lib/utils/datetime";

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

function CheckmarkGlyph({ sizePx }: { sizePx: number }) {
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

export function VoiceDetailScreen({ post }: VoiceDetailScreenProps) {
  const titleLineRef = useRef<HTMLHeadingElement>(null);
  const [titleTextWidthPx, setTitleTextWidthPx] = useState<number | null>(null);

  const displayDong = formatAdministrativeAreaNameForHomeDisplay(
    post.administrativeDongName,
  );

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
          {post.replyStatus === "replied" ? (
            <div
              style={{
                alignItems: "center",
                display: "flex",
                justifyContent: "center",
                paddingTop: uiSpacing.xxl,
              }}
            >
              <div
                style={{
                  alignItems: "center",
                  background: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  borderRadius: uiRadius.pill,
                  color: "#059669",
                  display: "flex",
                  fontSize: "13px",
                  fontWeight: 600,
                  gap: "6px",
                  padding: `${uiSpacing.xs} ${uiSpacing.lg}`,
                }}
              >
                <CheckCircle size={16} />
                답변이 도착했습니다
              </div>
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: uiSpacing.xl,
              paddingTop:
                post.replyStatus === "replied" ? uiSpacing.lg : uiSpacing.xxl,
            }}
          >
            <div
              style={{
                background: uiColors.surface,
                border: uiBrandYellow.postCardBorder,
                borderRadius: "22px",
                boxShadow: "0 2px 8px rgba(17, 24, 39, 0.04)",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: uiSpacing.md,
                padding: `${uiSpacing.lg} ${uiSpacing.xl}`,
                width: "100%",
              }}
            >
              <p
                style={{
                  color: uiColors.textMuted,
                  fontSize: "11px",
                  fontWeight: 400,
                  lineHeight: 1.35,
                  margin: 0,
                }}
              >
                <span style={{ color: uiColors.textStrong, fontWeight: 500 }}>
                  {displayDong}
                </span>
                <span>{` · ${formatRelativeTime(post.createdAt)}`}</span>
              </p>

              <p
                style={{
                  color: uiColors.textStrong,
                  fontSize: "15px",
                  fontWeight: 500,
                  lineHeight: 1.5,
                  margin: 0,
                  wordBreak: "keep-all",
                }}
              >
                {post.content}
              </p>

              {post.agreeCount > 0 ? (
                <div
                  style={{
                    alignItems: "center",
                    alignSelf: "flex-start",
                    background: "rgba(255, 255, 255, 0.96)",
                    border: `1px solid ${uiColors.border}`,
                    borderRadius: "999px",
                    boxShadow: "0 8px 18px rgba(17, 24, 39, 0.12)",
                    color: uiColors.textStrong,
                    display: "inline-flex",
                    gap: "6px",
                    padding: "6px 10px",
                  }}
                >
                  <CheckmarkGlyph sizePx={14} />
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      lineHeight: 1,
                    }}
                  >
                    {post.agreeCount}
                  </span>
                </div>
              ) : null}
            </div>

            {post.replyStatus === "replied" && post.reply ? (
              <div
                style={{
                  background: "#f0fdf4",
                  borderLeft: "3px solid #059669",
                  borderRadius: uiRadius.md,
                  display: "flex",
                  flexDirection: "column",
                  gap: uiSpacing.sm,
                  padding: uiSpacing.xl,
                }}
              >
                <div
                  style={{
                    alignItems: "center",
                    display: "flex",
                    gap: "6px",
                  }}
                >
                  <MessageCircle size={16} color="#059669" />
                  <span
                    style={{
                      color: "#059669",
                      fontSize: "14px",
                      fontWeight: 700,
                    }}
                  >
                    {post.reply.candidateName} 후보
                  </span>
                  <span
                    style={{
                      background: "#059669",
                      borderRadius: "4px",
                      color: "#ffffff",
                      fontSize: "10px",
                      fontWeight: 600,
                      padding: "1px 5px",
                    }}
                  >
                    인증됨
                  </span>
                  {post.reply.isPromise ? (
                    <span
                      style={{
                        background: "#fbbf24",
                        borderRadius: "4px",
                        color: "#78350f",
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "1px 5px",
                      }}
                    >
                      약속합니다
                    </span>
                  ) : null}
                </div>
                <p
                  style={{
                    color: uiColors.textBody,
                    fontSize: "15px",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {post.reply.content}
                </p>
                <span
                  style={{
                    color: uiColors.textMuted,
                    fontSize: uiTypography.meta.fontSize,
                  }}
                >
                  {formatRelativeTime(post.reply.createdAt)}
                  {post.reply.isPromise && post.reply.promiseDeadline
                    ? ` · 기한: ${post.reply.promiseDeadline}`
                    : ""}
                </span>
              </div>
            ) : null}
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
            <a
              href={`/api/card/${post.publicUuid}?type=voter`}
              download={`voice-${post.publicUuid}.png`}
              style={{
                alignItems: "center",
                appearance: "none",
                background: uiBrandYellow.ctaGradient,
                border: `1px solid ${uiBrandYellow.ctaBorder}`,
                borderRadius: uiRadius.md,
                boxShadow:
                  "0 8px 18px rgba(116, 94, 62, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.85)",
                color: "#000000",
                cursor: "pointer",
                display: "flex",
                fontSize: "14px",
                fontWeight: 600,
                gap: uiSpacing.xs,
                justifyContent: "center",
                padding: `14px ${uiSpacing.xl}`,
                textDecoration: "none",
                width: "100%",
              }}
            >
              <Download color="#000000" size={16} strokeWidth={2.25} />
              포토카드 다운로드
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
