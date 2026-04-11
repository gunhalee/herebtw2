"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import {
  uiColors,
  uiRadius,
  uiSpacing,
  uiTypography,
} from "../../lib/ui/tokens";

type OnboardingScreenProps = {
  candidateName: string;
  candidateId: string;
  district: string;
};

export function OnboardingScreen({
  candidateName,
  candidateId,
  district,
}: OnboardingScreenProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charCount = content.trim().length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (charCount < 1 || charCount > 100) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/candidate/first-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("등록에 실패했습니다.");
      }

      window.location.href = "/candidate/dashboard";
    } catch {
      setError("첫 마디를 등록하지 못했습니다. 다시 시도해 주세요.");
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        alignItems: "center",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minHeight: "100dvh",
        padding: `${uiSpacing.xxl} ${uiSpacing.pageX}`,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: uiSpacing.xxl,
          maxWidth: 480,
          width: "100%",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              alignItems: "center",
              background: "#eff6ff",
              borderRadius: "50%",
              display: "inline-flex",
              height: 56,
              justifyContent: "center",
              marginBottom: uiSpacing.md,
              width: 56,
            }}
          >
            <MessageSquare size={28} color="#2563eb" />
          </div>
          <h1
            style={{
              color: uiColors.textStrong,
              fontSize: "22px",
              fontWeight: 700,
              margin: "0 0 8px",
            }}
          >
            {candidateName} 후보님, 환영합니다
          </h1>
          <p
            style={{
              color: uiColors.textMuted,
              fontSize: "14px",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {district} 주민에게 첫 인사를 남겨 주세요.
            <br />
            첫 마디는 글 목록 최상단에 고정됩니다.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: uiSpacing.md,
          }}
        >
          <div style={{ position: "relative" }}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={100}
              placeholder={`"${district} 주민 여러분, 여러분의 이야기를 듣겠습니다."`}
              style={{
                appearance: "none",
                background: uiColors.surfaceMuted,
                border: `1px solid ${uiColors.border}`,
                borderRadius: uiRadius.md,
                color: uiColors.textStrong,
                fontSize: "16px",
                height: 140,
                lineHeight: 1.55,
                outline: "none",
                padding: `${uiSpacing.lg} ${uiSpacing.lg} calc(${uiSpacing.lg} + 20px)`,
                resize: "none",
                width: "100%",
              }}
            />
            <span
              style={{
                bottom: uiSpacing.sm,
                color: uiColors.textMuted,
                fontSize: uiTypography.meta.fontSize,
                position: "absolute",
                right: uiSpacing.md,
              }}
            >
              {charCount}/100
            </span>
          </div>

          {error ? (
            <p style={{ color: uiColors.danger, fontSize: "13px", margin: 0 }}>
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting || charCount < 1 || charCount > 100}
            style={{
              appearance: "none",
              background: uiColors.buttonPrimary,
              border: "none",
              borderRadius: uiRadius.md,
              color: "#ffffff",
              cursor:
                submitting || charCount < 1 ? "default" : "pointer",
              fontSize: "15px",
              fontWeight: 700,
              opacity: submitting || charCount < 1 ? 0.6 : 1,
              padding: "14px",
              width: "100%",
            }}
          >
            {submitting ? "등록 중..." : "첫 마디 등록하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
