"use client";

import Link from "next/link";
import { Calendar, MessageSquare, Star } from "lucide-react";
import {
  uiColors,
  uiRadius,
  uiSpacing,
  uiTypography,
} from "../../lib/ui/tokens";
import { formatRelativeTime } from "../../lib/utils/datetime";
import type { PromiseItem } from "./promise-archive-types";

function computeDDayText(
  electionDate: string,
  promiseDeadline: string | null,
): string {
  const now = new Date();
  const election = new Date(electionDate);

  if (now < election) {
    const daysUntil = Math.ceil(
      (election.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    return `선거일까지 D-${daysUntil}`;
  }

  if (!promiseDeadline) {
    const daysSince = Math.ceil(
      (now.getTime() - election.getTime()) / (1000 * 60 * 60 * 24),
    );
    return `D+${daysSince}`;
  }

  const deadline = new Date(promiseDeadline);

  if (now < deadline) {
    const daysSinceElection = Math.ceil(
      (now.getTime() - election.getTime()) / (1000 * 60 * 60 * 24),
    );
    const daysUntilDeadline = Math.ceil(
      (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    return `D+${daysSinceElection} / 기한까지 ${daysUntilDeadline}일`;
  }

  const daysOverdue = Math.ceil(
    (now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24),
  );
  return `기한 D+${daysOverdue} 경과`;
}

function PromiseArchiveCard({
  electionDate,
  promise,
}: {
  electionDate: string;
  promise: PromiseItem;
}) {
  const ddayText = computeDDayText(electionDate, promise.promise_deadline);

  return (
    <Link
      href={`/v/${promise.post_public_uuid}`}
      style={{
        background: "#ffffff",
        border: `1px solid ${uiColors.border}`,
        borderRadius: uiRadius.md,
        display: "flex",
        flexDirection: "column",
        gap: uiSpacing.md,
        padding: uiSpacing.lg,
        textDecoration: "none",
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: uiSpacing.sm,
        }}
      >
        <span
          style={{
            alignItems: "center",
            background: "#fef3c7",
            borderRadius: "6px",
            color: "#92400e",
            display: "flex",
            fontSize: "11px",
            fontWeight: 700,
            gap: "4px",
            padding: "3px 8px",
          }}
        >
          <Star size={12} />
          약속답변
        </span>
        <span
          style={{
            alignItems: "center",
            color: uiColors.textMuted,
            display: "flex",
            fontSize: "11px",
            gap: "4px",
          }}
        >
          <Calendar size={12} />
          {ddayText}
        </span>
      </div>

      <div
        style={{
          background: uiColors.surfaceMuted,
          borderRadius: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          padding: `${uiSpacing.sm} ${uiSpacing.md}`,
        }}
      >
        <p
          style={{
            color: uiColors.textBody,
            fontSize: "13px",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {promise.post_content}
        </p>
        <span
          style={{
            color: uiColors.textMuted,
            fontSize: "10px",
          }}
        >
          {promise.post_dong_name} · {formatRelativeTime(promise.post_created_at)}
        </span>
      </div>

      <div
        style={{
          borderLeft: "3px solid #2563eb",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          paddingLeft: uiSpacing.md,
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: "6px",
          }}
        >
          <MessageSquare size={14} color="#2563eb" />
          <span
            style={{
              color: "#2563eb",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            {promise.candidate_name} 후보
          </span>
        </div>
        <p
          style={{
            color: uiColors.textStrong,
            fontSize: "14px",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {promise.reply_content}
        </p>
        {promise.promise_deadline ? (
          <span
            style={{
              color: uiColors.textMuted,
              fontSize: "11px",
            }}
          >
            기한: {promise.promise_deadline}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

export function PromiseArchiveList({
  electionDate,
  promises,
}: {
  electionDate: string;
  promises: PromiseItem[];
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: uiSpacing.sm,
        padding: `${uiSpacing.lg} ${uiSpacing.pageX} ${uiSpacing.xxl}`,
      }}
    >
      <h2
        style={{
          color: uiColors.textStrong,
          fontSize: uiTypography.title.fontSize,
          fontWeight: uiTypography.title.fontWeight,
          margin: `0 0 ${uiSpacing.sm}`,
        }}
      >
        약속 목록 ({promises.length})
      </h2>

      {promises.length === 0 ? (
        <p
          style={{
            color: uiColors.textMuted,
            fontSize: "14px",
            padding: uiSpacing.xxl,
            textAlign: "center",
          }}
        >
          아직 등록된 약속이 없습니다.
        </p>
      ) : null}

      {promises.map((promise) => (
        <PromiseArchiveCard
          key={promise.reply_id}
          electionDate={electionDate}
          promise={promise}
        />
      ))}
    </div>
  );
}
