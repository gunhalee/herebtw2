"use client";

import Link from "next/link";
import { uiColors, uiRadius, uiSpacing } from "../../lib/ui/tokens";
import { PromiseArchiveList } from "./promise-archive-list";
import type { PromiseArchiveScreenProps } from "./promise-archive-types";

export function PromiseArchiveScreen({
  candidate,
  promises,
  stats,
  electionDate,
}: PromiseArchiveScreenProps) {
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
      <header
        style={{
          background: "#ffffff",
          borderBottom: `1px solid ${uiColors.border}`,
          padding: `${uiSpacing.lg} ${uiSpacing.pageX}`,
          paddingTop: `calc(${uiSpacing.lg} + env(safe-area-inset-top, 0px))`,
        }}
      >
        <Link
          href="/"
          style={{
            color: uiColors.textMuted,
            fontSize: "12px",
            textDecoration: "none",
          }}
        >
          홈으로
        </Link>
      </header>

      <div
        style={{
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
          gap: uiSpacing.md,
          padding: `${uiSpacing.xxl} ${uiSpacing.pageX}`,
        }}
      >
        <div>
          <h1
            style={{
              color: uiColors.textStrong,
              fontSize: "22px",
              fontWeight: 700,
              margin: 0,
            }}
          >
            {candidate.name} 후보
          </h1>
          <p
            style={{
              color: uiColors.textMuted,
              fontSize: "14px",
              margin: "4px 0 0",
            }}
          >
            {candidate.district}
          </p>
        </div>

        <p
          style={{
            background: uiColors.surfaceMuted,
            borderRadius: uiRadius.md,
            color: uiColors.textBody,
            fontSize: "14px",
            lineHeight: 1.5,
            margin: 0,
            padding: `${uiSpacing.md} ${uiSpacing.lg}`,
          }}
        >
          <strong>{stats.repliedPosts}명</strong>에게 답했고{" "}
          <strong>{stats.promiseCount}건</strong>의 약속을 남긴 후보의 응답률은{" "}
          {stats.replyRate}%입니다.
        </p>
      </div>

      <PromiseArchiveList electionDate={electionDate} promises={promises} />

      <div
        style={{
          padding: `0 ${uiSpacing.pageX} ${uiSpacing.xxl}`,
        }}
      >
        <Link
          href="/"
          style={{
            alignItems: "center",
            background: uiColors.buttonPrimary,
            borderRadius: uiRadius.md,
            color: "#ffffff",
            display: "flex",
            fontSize: "15px",
            fontWeight: 700,
            justifyContent: "center",
            padding: "14px",
            textDecoration: "none",
            width: "100%",
          }}
        >
          나도 목소리 남기기
        </Link>
      </div>
    </div>
  );
}
