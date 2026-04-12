"use client";

import { uiColors, uiRadius, uiSpacing } from "../../lib/ui/tokens";
import type { DashboardStats } from "./candidate-dashboard-types";

type CandidateDashboardStatsGridProps = {
  stats: DashboardStats;
};

export function CandidateDashboardStatsGrid({
  stats,
}: CandidateDashboardStatsGridProps) {
  return (
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
            alignItems: "center",
            background: "#ffffff",
            borderRadius: uiRadius.md,
            display: "flex",
            flexDirection: "column",
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
  );
}
