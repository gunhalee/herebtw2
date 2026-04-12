"use client";

import { BarChart3, Check, LogOut, MessageCircle, Pencil, X } from "lucide-react";
import { useState } from "react";
import {
  uiColors,
  uiRadius,
  uiSpacing,
  uiTypography,
} from "../../lib/ui/tokens";
import { formatRelativeTime } from "../../lib/utils/datetime";
import { createClient } from "../../lib/client";

type DashboardPost = {
  id: string;
  public_uuid: string;
  content: string;
  administrative_dong_name: string;
  created_at: string;
  reply_status: string;
  is_pinned: boolean;
  author_type: string;
  agree_count: number;
  has_reply: boolean;
  reply_candidate_name?: string | null;
  reply_content?: string | null;
  reply_is_promise?: boolean;
  reply_promise_deadline?: string | null;
  reply_created_at?: string | null;
};

type DashboardStats = {
  total_posts: number;
  replied_posts: number;
  unreplied_posts: number;
  reply_rate: number;
};

type FirstMessage = {
  id: string;
  content: string;
};

type DashboardScreenProps = {
  candidateName: string;
  candidateId: string;
  district: string;
  posts: DashboardPost[];
  stats: DashboardStats;
  firstMessage: FirstMessage | null;
};

const HIGHLIGHT_THRESHOLD = 3;

export function DashboardScreen({
  candidateName,
  candidateId,
  district,
  posts,
  stats,
  firstMessage,
}: DashboardScreenProps) {
  const [editingMessage, setEditingMessage] = useState(false);
  const [messageContent, setMessageContent] = useState(firstMessage?.content ?? "");
  const [savingMessage, setSavingMessage] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function handleSaveMessage() {
    const trimmed = messageContent.trim();
    if (trimmed.length < 1 || trimmed.length > 100) {
      setMessageError("1~100자 이내로 입력해 주세요.");
      return;
    }
    setSavingMessage(true);
    setMessageError(null);
    try {
      const res = await fetch("/api/candidate/first-message", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      if (!res.ok) {
        setMessageError("저장에 실패했습니다. 다시 시도해 주세요.");
      } else {
        setEditingMessage(false);
      }
    } catch {
      setMessageError("저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setSavingMessage(false);
    }
  }

  function handleCancelEdit() {
    setMessageContent(firstMessage?.content ?? "");
    setMessageError(null);
    setEditingMessage(false);
  }

  return (
    <div
      style={{
        background: "#f9fafb",
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
          background: "#ffffff",
          borderBottom: `1px solid ${uiColors.border}`,
          display: "flex",
          justifyContent: "space-between",
          padding: `${uiSpacing.lg} ${uiSpacing.pageX}`,
          paddingTop: `calc(${uiSpacing.lg} + env(safe-area-inset-top, 0px))`,
        }}
      >
        <div>
          <h1
            style={{
              color: uiColors.textStrong,
              fontSize: "16px",
              fontWeight: 700,
              margin: 0,
            }}
          >
            {candidateName} 후보
          </h1>
          <p
            style={{
              color: uiColors.textMuted,
              fontSize: "12px",
              margin: 0,
            }}
          >
            {district}
          </p>
        </div>
        <button
          onClick={handleLogout}
          type="button"
          style={{
            alignItems: "center",
            appearance: "none",
            background: "transparent",
            border: "none",
            color: uiColors.textMuted,
            cursor: "pointer",
            display: "flex",
            gap: "4px",
            fontSize: "12px",
            padding: uiSpacing.xs,
          }}
        >
          <LogOut size={14} />
          로그아웃
        </button>
      </header>

      {/* 후보자 한마디 */}
      {firstMessage ? (
        <div
          style={{
            background: "#ffffff",
            borderBottom: `1px solid ${uiColors.border}`,
            padding: `${uiSpacing.md} ${uiSpacing.pageX}`,
          }}
        >
          <div
            style={{
              alignItems: "center",
              display: "flex",
              gap: uiSpacing.xs,
              marginBottom: "6px",
            }}
          >
            <span
              style={{
                color: uiColors.textMuted,
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              후보자 한마디
            </span>
          </div>

          {editingMessage ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                maxLength={100}
                rows={2}
                style={{
                  border: `1px solid ${uiColors.border}`,
                  borderRadius: uiRadius.md,
                  color: uiColors.textStrong,
                  fontSize: "14px",
                  lineHeight: 1.5,
                  outline: "none",
                  padding: "8px 10px",
                  resize: "none",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
              <div style={{ alignItems: "center", display: "flex", gap: "6px" }}>
                <span style={{ color: uiColors.textMuted, fontSize: "11px", marginRight: "auto" }}>
                  {messageContent.trim().length}/100
                </span>
                {messageError ? (
                  <span style={{ color: "#ef4444", fontSize: "11px" }}>{messageError}</span>
                ) : null}
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{
                    alignItems: "center",
                    appearance: "none",
                    background: "transparent",
                    border: `1px solid ${uiColors.border}`,
                    borderRadius: uiRadius.md,
                    color: uiColors.textMuted,
                    cursor: "pointer",
                    display: "flex",
                    fontSize: "12px",
                    gap: "3px",
                    padding: "4px 10px",
                  }}
                >
                  <X size={12} />
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSaveMessage}
                  disabled={savingMessage}
                  style={{
                    alignItems: "center",
                    appearance: "none",
                    background: uiColors.buttonPrimary,
                    border: "none",
                    borderRadius: uiRadius.md,
                    color: "#ffffff",
                    cursor: savingMessage ? "not-allowed" : "pointer",
                    display: "flex",
                    fontSize: "12px",
                    fontWeight: 600,
                    gap: "3px",
                    opacity: savingMessage ? 0.6 : 1,
                    padding: "4px 10px",
                  }}
                >
                  <Check size={12} />
                  저장
                </button>
              </div>
            </div>
          ) : (
            <div style={{ alignItems: "flex-start", display: "flex", gap: "8px" }}>
              <p
                style={{
                  color: uiColors.textStrong,
                  flex: 1,
                  fontSize: "14px",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {messageContent}
              </p>
              <button
                type="button"
                onClick={() => setEditingMessage(true)}
                style={{
                  alignItems: "center",
                  appearance: "none",
                  background: "transparent",
                  border: `1px solid ${uiColors.border}`,
                  borderRadius: uiRadius.md,
                  color: uiColors.textMuted,
                  cursor: "pointer",
                  display: "flex",
                  flexShrink: 0,
                  fontSize: "12px",
                  gap: "3px",
                  padding: "3px 8px",
                }}
              >
                <Pencil size={11} />
                수정
              </button>
            </div>
          )}
        </div>
      ) : null}

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gap: uiSpacing.sm,
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          padding: `${uiSpacing.lg} ${uiSpacing.pageX}`,
        }}
      >
        {[
          { label: "전체 글", value: stats.total_posts },
          { label: "답변 완료", value: stats.replied_posts },
          { label: "미답변", value: stats.unreplied_posts },
          { label: "답변률", value: `${stats.reply_rate}%` },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "#ffffff",
              borderRadius: uiRadius.md,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
              padding: `${uiSpacing.md} ${uiSpacing.xs}`,
            }}
          >
            <span
              style={{
                color: uiColors.textStrong,
                fontSize: "18px",
                fontWeight: 700,
              }}
            >
              {stat.value}
            </span>
            <span
              style={{
                color: uiColors.textMuted,
                fontSize: "10px",
                fontWeight: 600,
              }}
            >
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Posts List */}
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

          return (
            <a
              key={post.id}
              href={
                post.has_reply || post.is_pinned
                  ? `/v/${post.public_uuid}`
                  : `/candidate/reply/${post.id}`
              }
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
              {/* Highlight badge */}
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

              {/* Reply preview */}
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
            </a>
          );
        })}
      </div>
    </div>
  );
}
