"use client";

import { useState } from "react";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import {
  uiColors,
  uiRadius,
  uiSpacing,
  uiTypography,
} from "../../lib/ui/tokens";
import { formatRelativeTime } from "../../lib/utils/datetime";

type ReplyComposeScreenProps = {
  postId: string;
  postContent: string;
  postDongName: string;
  postCreatedAt: string;
  candidateId: string;
  candidateName: string;
};

export function ReplyComposeScreen({
  postId,
  postContent,
  postDongName,
  postCreatedAt,
  candidateId,
  candidateName,
}: ReplyComposeScreenProps) {
  const [content, setContent] = useState("");
  const [isPromise, setIsPromise] = useState(false);
  const [promiseDeadline, setPromiseDeadline] = useState<string>("6months");
  const [customDeadline, setCustomDeadline] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charCount = content.trim().length;

  function getDeadlineValue(): string | null {
    if (!isPromise) return null;
    const electionDate = new Date("2026-06-03");
    switch (promiseDeadline) {
      case "3months": {
        const d = new Date(electionDate);
        d.setMonth(d.getMonth() + 3);
        return d.toISOString().split("T")[0];
      }
      case "6months": {
        const d = new Date(electionDate);
        d.setMonth(d.getMonth() + 6);
        return d.toISOString().split("T")[0];
      }
      case "1year": {
        const d = new Date(electionDate);
        d.setFullYear(d.getFullYear() + 1);
        return d.toISOString().split("T")[0];
      }
      case "custom":
        return customDeadline || null;
      default:
        return null;
    }
  }

  async function handleConfirmSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/candidate/replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          candidateId,
          content: content.trim(),
          isPromise,
          promiseDeadline: getDeadlineValue(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error?.message || "답변 등록에 실패했습니다.");
      }

      window.location.href = "/candidate/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "답변 등록에 실패했습니다.");
      setShowConfirm(false);
      setSubmitting(false);
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
          gap: uiSpacing.sm,
          padding: `${uiSpacing.lg} ${uiSpacing.pageX}`,
          paddingTop: `calc(${uiSpacing.lg} + env(safe-area-inset-top, 0px))`,
        }}
      >
        <a
          href="/candidate/dashboard"
          style={{ color: uiColors.textStrong, display: "flex" }}
        >
          <ArrowLeft size={20} />
        </a>
        <h1
          style={{
            color: uiColors.textStrong,
            fontSize: "16px",
            fontWeight: 700,
            margin: 0,
          }}
        >
          답변 작성
        </h1>
      </header>

      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          gap: uiSpacing.xl,
          padding: `${uiSpacing.xxl} ${uiSpacing.pageX}`,
        }}
      >
        {/* Original post */}
        <div
          style={{
            background: uiColors.surfaceMuted,
            borderRadius: uiRadius.md,
            display: "flex",
            flexDirection: "column",
            gap: uiSpacing.xs,
            padding: uiSpacing.lg,
          }}
        >
          <p
            style={{
              color: uiColors.textStrong,
              fontSize: "15px",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {postContent}
          </p>
          <span
            style={{
              color: uiColors.textMuted,
              fontSize: uiTypography.meta.fontSize,
            }}
          >
            {postDongName} · {formatRelativeTime(postCreatedAt)}
          </span>
        </div>

        {/* Reply input */}
        <div style={{ position: "relative" }}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={200}
            placeholder={`${candidateName} 후보로서 주민에게 답변을 남겨 주세요.`}
            style={{
              appearance: "none",
              background: "#ffffff",
              border: `1px solid ${uiColors.border}`,
              borderRadius: uiRadius.md,
              color: uiColors.textStrong,
              fontSize: "16px",
              height: 160,
              lineHeight: 1.55,
              outline: "none",
              padding: `${uiSpacing.lg} ${uiSpacing.lg} calc(${uiSpacing.lg} + 24px)`,
              resize: "none",
              width: "100%",
            }}
          />
          <span
            style={{
              bottom: uiSpacing.sm,
              color:
                charCount > 180
                  ? uiColors.danger
                  : uiColors.textMuted,
              fontSize: uiTypography.meta.fontSize,
              position: "absolute",
              right: uiSpacing.md,
            }}
          >
            {charCount}/200
          </span>
        </div>

        {/* Promise toggle */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: uiSpacing.sm,
          }}
        >
          <label
            style={{
              alignItems: "center",
              cursor: "pointer",
              display: "flex",
              gap: uiSpacing.sm,
            }}
          >
            <input
              type="checkbox"
              checked={isPromise}
              onChange={(e) => setIsPromise(e.target.checked)}
              style={{
                accentColor: uiColors.buttonPrimary,
                height: 18,
                width: 18,
              }}
            />
            <span
              style={{
                color: uiColors.textStrong,
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              이 답변은 약속입니다
            </span>
          </label>

          {isPromise ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: uiSpacing.xs,
                paddingLeft: "26px",
              }}
            >
              <select
                value={promiseDeadline}
                onChange={(e) => setPromiseDeadline(e.target.value)}
                style={{
                  appearance: "auto",
                  background: uiColors.surfaceMuted,
                  border: `1px solid ${uiColors.border}`,
                  borderRadius: "8px",
                  color: uiColors.textStrong,
                  fontSize: "13px",
                  padding: `${uiSpacing.sm} ${uiSpacing.md}`,
                }}
              >
                <option value="3months">당선 후 3개월</option>
                <option value="6months">당선 후 6개월</option>
                <option value="1year">당선 후 1년</option>
                <option value="custom">직접 입력</option>
              </select>
              {promiseDeadline === "custom" ? (
                <input
                  type="date"
                  value={customDeadline}
                  onChange={(e) => setCustomDeadline(e.target.value)}
                  style={{
                    appearance: "auto",
                    background: uiColors.surfaceMuted,
                    border: `1px solid ${uiColors.border}`,
                    borderRadius: "8px",
                    color: uiColors.textStrong,
                    fontSize: "13px",
                    padding: `${uiSpacing.sm} ${uiSpacing.md}`,
                  }}
                />
              ) : null}
            </div>
          ) : null}
        </div>

        {error ? (
          <p style={{ color: uiColors.danger, fontSize: "13px", margin: 0 }}>
            {error}
          </p>
        ) : null}

        {/* Submit button */}
        <button
          onClick={() => setShowConfirm(true)}
          disabled={charCount < 1 || charCount > 200}
          type="button"
          style={{
            appearance: "none",
            background: uiColors.buttonPrimary,
            border: "none",
            borderRadius: uiRadius.md,
            color: "#ffffff",
            cursor: charCount < 1 ? "default" : "pointer",
            fontSize: "15px",
            fontWeight: 700,
            marginTop: "auto",
            opacity: charCount < 1 ? 0.5 : 1,
            padding: "14px",
            width: "100%",
          }}
        >
          답변 등록
        </button>
      </div>

      {/* Confirmation modal */}
      {showConfirm ? (
        <div
          style={{
            alignItems: "center",
            background: "rgba(17, 24, 39, 0.4)",
            display: "flex",
            inset: 0,
            justifyContent: "center",
            padding: uiSpacing.pageX,
            position: "fixed",
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: uiRadius.lg,
              display: "flex",
              flexDirection: "column",
              gap: uiSpacing.xl,
              maxWidth: 360,
              padding: uiSpacing.xxl,
              width: "100%",
            }}
          >
            <div
              style={{
                alignItems: "center",
                display: "flex",
                flexDirection: "column",
                gap: uiSpacing.sm,
                textAlign: "center",
              }}
            >
              <AlertTriangle size={32} color="#f59e0b" />
              <h3
                style={{
                  color: uiColors.textStrong,
                  fontSize: "16px",
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                답변을 등록하시겠습니까?
              </h3>
              <p
                style={{
                  color: uiColors.textMuted,
                  fontSize: "13px",
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                답변은 등록 후 수정할 수 없습니다.
                {isPromise
                  ? " 이 답변은 '약속' 으로 기록됩니다."
                  : ""}
              </p>
            </div>
            <div style={{ display: "flex", gap: uiSpacing.sm }}>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
                type="button"
                style={{
                  appearance: "none",
                  background: uiColors.surfaceMuted,
                  border: `1px solid ${uiColors.border}`,
                  borderRadius: uiRadius.md,
                  color: uiColors.textBody,
                  cursor: "pointer",
                  flex: 1,
                  fontSize: "14px",
                  fontWeight: 600,
                  padding: "12px",
                }}
              >
                취소
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={submitting}
                type="button"
                style={{
                  appearance: "none",
                  background: uiColors.buttonPrimary,
                  border: "none",
                  borderRadius: uiRadius.md,
                  color: "#ffffff",
                  cursor: submitting ? "default" : "pointer",
                  flex: 1,
                  fontSize: "14px",
                  fontWeight: 700,
                  opacity: submitting ? 0.7 : 1,
                  padding: "12px",
                }}
              >
                {submitting ? "등록 중..." : "등록"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
