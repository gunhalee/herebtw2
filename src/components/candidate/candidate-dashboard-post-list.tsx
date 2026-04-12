"use client";

import Link from "next/link";
import { BarChart3, MessageCircle } from "lucide-react";
import { uiColors, uiRadius, uiSpacing, uiTypography } from "../../lib/ui/tokens";
import { formatRelativeTime } from "../../lib/utils/datetime";
import type { DashboardPost } from "./candidate-dashboard-types";

const HIGHLIGHT_THRESHOLD = 3;

type CandidateDashboardPostListProps = {
  posts: DashboardPost[];
};

export function CandidateDashboardPostList({
  posts,
}: CandidateDashboardPostListProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: uiSpacing.sm,
        padding: `0 ${uiSpacing.pageX} ${uiSpacing.xxl}`,
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
          padding: `${uiSpacing.sm} 0`,
        }}
      >
        <h2
          style={{
            color: uiColors.textStrong,
            fontSize: uiTypography.title.fontSize,
            fontWeight: uiTypography.title.fontWeight,
            margin: 0,
          }}
        >
          주민 목소리
        </h2>
        <BarChart3 size={16} color={uiColors.textMuted} />
      </div>

      {posts.length === 0 ? (
        <p
          style={{
            color: uiColors.textMuted,
            fontSize: "14px",
            padding: uiSpacing.xxl,
            textAlign: "center",
          }}
        >
          아직 글이 없습니다.
        </p>
      ) : null}

      {posts.map((post) => {
        const isHighlighted =
          !post.has_reply && post.agree_count >= HIGHLIGHT_THRESHOLD;
        const href =
          post.has_reply || post.is_pinned
            ? `/v/${post.public_uuid}`
            : `/candidate/reply/${post.id}`;

        return (
          <Link
            key={post.id}
            href={href}
            style={{
              background: isHighlighted ? "#fffbeb" : "#ffffff",
              border: isHighlighted
                ? "1px solid #fde68a"
                : `1px solid ${uiColors.border}`,
              borderRadius: uiRadius.md,
              display: "flex",
              flexDirection: "column",
              gap: uiSpacing.sm,
              padding: uiSpacing.lg,
              textDecoration: "none",
            }}
          >
            {isHighlighted ? (
              <span
                style={{
                  background: "#fef3c7",
                  borderRadius: "6px",
                  color: "#92400e",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "3px 8px",
                  width: "fit-content",
                }}
              >
                주민 {post.agree_count}명이 관심을 보인 목소리입니다
              </span>
            ) : null}

            <p
              style={{
                color: uiColors.textStrong,
                fontSize: "14px",
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {post.content}
            </p>

            <div
              style={{
                alignItems: "center",
                color: uiColors.textMuted,
                display: "flex",
                fontSize: "11px",
                gap: uiSpacing.sm,
              }}
            >
              <span>{post.administrative_dong_name}</span>
              <span>·</span>
              <span>{formatRelativeTime(post.created_at)}</span>
              <span>·</span>
              <span>공감 {post.agree_count}</span>
              <span style={{ marginLeft: "auto" }}>
                <MessageCircle
                  size={14}
                  fill={post.has_reply ? uiColors.buttonPrimary : "none"}
                  color={
                    post.has_reply
                      ? uiColors.buttonPrimary
                      : uiColors.textMuted
                  }
                />
              </span>
            </div>

            {post.has_reply && post.reply_content ? (
              <div
                style={{
                  borderTop: `1px solid ${uiColors.border}`,
                  color: uiColors.textBody,
                  fontSize: "12px",
                  lineHeight: 1.5,
                  paddingTop: uiSpacing.sm,
                }}
              >
                <span style={{ fontWeight: 600 }}>내 답변:</span>{" "}
                {post.reply_content}
                {post.reply_is_promise ? (
                  <span
                    style={{
                      background: "#fbbf24",
                      borderRadius: "4px",
                      color: "#78350f",
                      fontSize: "10px",
                      fontWeight: 700,
                      marginLeft: "6px",
                      padding: "1px 4px",
                    }}
                  >
                    약속
                  </span>
                ) : null}
              </div>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
