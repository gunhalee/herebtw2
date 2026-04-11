"use client";

import { useState } from "react";
import {
  Check,
  CheckCircle,
  Copy,
  Download,
  Heart,
  MessageCircle,
  Send,
} from "lucide-react";
import {
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

export function VoiceDetailScreen({ post }: VoiceDetailScreenProps) {
  const [copied, setCopied] = useState(false);

  const voiceUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/v/${post.publicUuid}`
      : `/v/${post.publicUuid}`;

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(voiceUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent
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
      {/* Header */}
      <header
        style={{
          alignItems: "center",
          borderBottom: `1px solid ${uiColors.border}`,
          display: "flex",
          justifyContent: "center",
          padding: `${uiSpacing.lg} ${uiSpacing.pageX}`,
          paddingTop: `calc(${uiSpacing.lg} + env(safe-area-inset-top, 0px))`,
        }}
      >
        <a
          href="/"
          style={{
            color: uiColors.textStrong,
            fontSize: "16px",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          여기 근데
        </a>
      </header>

      {/* Status Badge */}
      <div
        style={{
          alignItems: "center",
          display: "flex",
          justifyContent: "center",
          padding: `${uiSpacing.xxl} ${uiSpacing.pageX} 0`,
        }}
      >
        {post.replyStatus === "replied" ? (
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
        ) : (
          <div
            style={{
              alignItems: "center",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: uiRadius.pill,
              color: "#2563eb",
              display: "flex",
              fontSize: "13px",
              fontWeight: 600,
              gap: "6px",
              padding: `${uiSpacing.xs} ${uiSpacing.lg}`,
            }}
          >
            <Send size={16} />
            전달됨
          </div>
        )}
      </div>

      {/* Post Card */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: uiSpacing.xl,
          padding: `${uiSpacing.xxl} ${uiSpacing.pageX}`,
        }}
      >
        <div
          style={{
            background: uiColors.surfaceMuted,
            borderRadius: uiRadius.lg,
            display: "flex",
            flexDirection: "column",
            gap: uiSpacing.md,
            padding: uiSpacing.xxl,
          }}
        >
          <p
            style={{
              color: uiColors.textStrong,
              fontSize: "18px",
              fontWeight: 500,
              lineHeight: 1.6,
              margin: 0,
              wordBreak: "keep-all",
            }}
          >
            {post.content}
          </p>

          <div
            style={{
              alignItems: "center",
              color: uiColors.textMuted,
              display: "flex",
              fontSize: uiTypography.meta.fontSize,
              gap: uiSpacing.sm,
            }}
          >
            <span>{post.administrativeDongName}</span>
            <span>·</span>
            <span>{formatRelativeTime(post.createdAt)}</span>
          </div>

          <div
            style={{
              alignItems: "center",
              color: uiColors.textMuted,
              display: "flex",
              fontSize: uiTypography.meta.fontSize,
              gap: "4px",
            }}
          >
            <Heart size={14} />
            <span>공감 {post.agreeCount}</span>
          </div>
        </div>

        {/* Reply area (Phase 2) */}
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

      {/* Actions */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: uiSpacing.md,
          padding: `0 ${uiSpacing.pageX} ${uiSpacing.xxl}`,
        }}
      >
        <a
          href={`/api/card/${post.publicUuid}?type=voter`}
          download={`voice-${post.publicUuid}.png`}
          style={{
            alignItems: "center",
            appearance: "none",
            background: uiColors.surfaceAccent,
            border: `1px solid ${uiColors.border}`,
            borderRadius: uiRadius.md,
            color: uiColors.textSoftAccent,
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
          <Download size={16} />
          포토카드 다운로드
        </a>

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
            fontSize: "14px",
            fontWeight: 600,
            gap: uiSpacing.xs,
            justifyContent: "center",
            padding: `14px ${uiSpacing.xl}`,
            transition: "all 150ms ease",
            width: "100%",
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

        <a
          href="/"
          style={{
            alignItems: "center",
            appearance: "none",
            background: uiColors.buttonPrimary,
            borderRadius: uiRadius.md,
            color: "#ffffff",
            display: "flex",
            fontSize: "15px",
            fontWeight: 700,
            justifyContent: "center",
            padding: `14px ${uiSpacing.xl}`,
            textDecoration: "none",
            width: "100%",
          }}
        >
          나도 목소리 남기기
        </a>
      </div>
    </div>
  );
}
