"use client";

import { Calendar, MessageSquare, Star } from "lucide-react";
import {
  uiColors,
  uiRadius,
  uiSpacing,
  uiTypography,
} from "../../lib/ui/tokens";
import { formatRelativeTime } from "../../lib/utils/datetime";

type PromiseItem = {
  reply_id: string;
  post_id: string;
  post_public_uuid: string;
  post_content: string;
  post_dong_name: string;
  post_created_at: string;
  reply_content: string;
  reply_created_at: string;
  promise_deadline: string | null;
  candidate_name: string;
  candidate_district: string;
};

type PromiseArchiveScreenProps = {
  candidate: {
    id: string;
    name: string;
    district: string;
  };
  promises: PromiseItem[];
  stats: {
    totalPosts: number;
    repliedPosts: number;
    replyRate: number;
    promiseCount: number;
  };
  electionDate: string;
};

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
      {/* Header */}
      <header
        style={{
          background: "#ffffff",
          borderBottom: `1px solid ${uiColors.border}`,
          padding: `${uiSpacing.lg} ${uiSpacing.pageX}`,
          paddingTop: `calc(${uiSpacing.lg} + env(safe-area-inset-top, 0px))`,
        }}
      >
        <a
          href="/"
          style={{
            color: uiColors.textMuted,
            fontSize: "12px",
            textDecoration: "none",
          }}
        >
          여기 근데
        </a>
      </header>

      {/* Candidate Profile */}
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
          주민 <strong>{stats.repliedPosts}명</strong>에게 답하고{" "}
          <strong>{stats.promiseCount}개</strong>의 약속을 한 후보 ·{" "}
          답변률 {stats.replyRate}%
        </p>
      </div>

      {/* Promise List */}
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

        {promises.map((promise) => {
          const ddayText = computeDDayText(
            electionDate,
            promise.promise_deadline,
          );

          return (
            <a
              key={promise.reply_id}
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
              {/* D-day badge */}
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
                  약속합니다
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

              {/* Original post */}
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
                  {promise.post_dong_name} ·{" "}
                  {formatRelativeTime(promise.post_created_at)}
                </span>
              </div>

              {/* Candidate reply */}
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
            </a>
          );
        })}
      </div>

      {/* CTA */}
      <div
        style={{
          padding: `0 ${uiSpacing.pageX} ${uiSpacing.xxl}`,
        }}
      >
        <a
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
        </a>
      </div>
    </div>
  );
}
