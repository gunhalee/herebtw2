"use client";

import { useState } from "react";
import { createClient } from "../../../lib/client";
import {
  uiColors,
  uiRadius,
  uiSpacing,
} from "../../../lib/ui/tokens";

export default function CandidateLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError("이메일 또는 비밀번호를 확인해 주세요.");
        return;
      }

      window.location.href = "/candidate/dashboard";
    } catch {
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
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
          maxWidth: 400,
          width: "100%",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              color: uiColors.textStrong,
              fontSize: "24px",
              fontWeight: 700,
              margin: "0 0 8px",
            }}
          >
            후보 로그인
          </h1>
          <p
            style={{
              color: uiColors.textMuted,
              fontSize: "14px",
              margin: 0,
            }}
          >
            관리자로부터 받은 계정으로 로그인하세요.
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
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label
              htmlFor="email"
              style={{
                color: uiColors.textBody,
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                appearance: "none",
                background: uiColors.surfaceMuted,
                border: `1px solid ${uiColors.border}`,
                borderRadius: uiRadius.md,
                color: uiColors.textStrong,
                fontSize: "15px",
                outline: "none",
                padding: `${uiSpacing.md} ${uiSpacing.lg}`,
                width: "100%",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label
              htmlFor="password"
              style={{
                color: uiColors.textBody,
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                appearance: "none",
                background: uiColors.surfaceMuted,
                border: `1px solid ${uiColors.border}`,
                borderRadius: uiRadius.md,
                color: uiColors.textStrong,
                fontSize: "15px",
                outline: "none",
                padding: `${uiSpacing.md} ${uiSpacing.lg}`,
                width: "100%",
              }}
            />
          </div>

          {error ? (
            <p style={{ color: uiColors.danger, fontSize: "13px", margin: 0 }}>
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            style={{
              appearance: "none",
              background: loading ? "#9ca3af" : uiColors.buttonPrimary,
              border: "none",
              borderRadius: uiRadius.md,
              color: "#ffffff",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "15px",
              fontWeight: 700,
              marginTop: uiSpacing.sm,
              padding: "14px",
              pointerEvents: loading ? "none" : "auto",
              transition: "background 0.15s",
              width: "100%",
            }}
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <a
          href="/"
          style={{
            color: uiColors.textMuted,
            fontSize: "13px",
            textAlign: "center",
            textDecoration: "underline",
            textUnderlineOffset: "3px",
          }}
        >
          유권자 메인으로 돌아가기
        </a>
      </div>
    </div>
  );
}
