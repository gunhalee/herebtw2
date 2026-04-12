"use client";

import Image from "next/image";
import { formatAdministrativeAreaNameForHomeDisplay } from "../../lib/geo/format-administrative-area";
import { formatBucketedDistance } from "../../lib/geo/format-bucketed-distance";
import { uiBrandYellow, uiColors, uiSpacing } from "../../lib/ui/tokens";
import thumbsUpImage from "../thumbs_up.png";

type PostListItemCardProps = {
  menuPostId: string;
  agreeCount: number;
  administrativeDongName: string;
  content: string;
  distanceMeters: number;
  isHighlighted: boolean;
  isMenuOpen?: boolean;
  myAgree: boolean;
  relativeTime: string;
  replyStatus?: "delivered" | "replied";
  replyCandidateName?: string | null;
  replyCandidatePhotoUrl?: string | null;
  replyCandidateLocalCouncilDistrict?: string | null;
  replyCandidateCouncilType?: string | null;
  replyContent?: string | null;
  replyIsPromise?: boolean | null;
  onCloseMenu?: () => void;
  onOpenMenu?: () => void;
  onToggleAgree?: () => void;
};

export function PostListItemCard({
  menuPostId,
  agreeCount,
  administrativeDongName,
  content,
  distanceMeters,
  isHighlighted,
  isMenuOpen = false,
  myAgree,
  relativeTime,
  replyStatus,
  replyCandidateName,
  replyCandidatePhotoUrl,
  replyCandidateLocalCouncilDistrict,
  replyCandidateCouncilType,
  replyContent,
  replyIsPromise,
  onCloseMenu,
  onOpenMenu,
  onToggleAgree,
}: PostListItemCardProps) {
  const displayAdministrativeDongName =
    formatAdministrativeAreaNameForHomeDisplay(administrativeDongName);
  const agreeButtonBackground = myAgree
    ? uiBrandYellow.surfaceWarm
    : "rgba(255, 255, 255, 0.96)";
  const agreeButtonBorder = myAgree ? uiBrandYellow.borderWarm : uiColors.border;
  const hasReply = replyStatus === "replied" && Boolean(replyContent);
  const replyNameLabel = replyCandidateName?.trim() ?? "";
  const replyDistrictLabel = replyCandidateLocalCouncilDistrict?.trim() ?? "";
  const replyCouncilBadge =
    replyCandidateCouncilType ?? (replyDistrictLabel ? "구·시·군의회" : null);

  return (
    <>
      <button
        onClick={onToggleAgree}
        style={{
          alignItems: "center",
          background: agreeButtonBackground,
          border: `1px solid ${agreeButtonBorder}`,
          borderRadius: "999px",
          boxShadow: "0 8px 18px rgba(17, 24, 39, 0.12)",
          color: uiColors.textStrong,
          cursor: "pointer",
          display: "inline-flex",
          gap: "6px",
          padding: "6px 10px",
          position: "absolute",
          right: uiSpacing.md,
          bottom: 0,
          transform: "translateY(18%)",
          zIndex: 1,
        }}
        type="button"
      >
        <Image alt="" src={thumbsUpImage} width={14} height={14} />
        <span
          style={{
            color: myAgree ? uiColors.textStrong : uiColors.textMuted,
            fontSize: "12px",
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          {agreeCount}
        </span>
      </button>

      <div
        style={{
          background: uiColors.surface,
          border: isHighlighted
            ? "1px solid rgba(17, 24, 39, 0.14)"
            : "1px solid rgba(17, 24, 39, 0.08)",
          borderRadius: "22px",
          boxShadow: isHighlighted
            ? "0 4px 12px rgba(17, 24, 39, 0.07)"
            : "0 2px 8px rgba(17, 24, 39, 0.04)",
          boxSizing: "border-box",
          color: uiColors.textStrong,
          overflow: "hidden",
          position: "relative",
          width: "100%",
        }}
      >
        {/* 답변 있는 카드: 왼쪽 노란 띠 */}
        {hasReply ? (
          <div
            style={{
              background: uiBrandYellow.borderWarm,
              bottom: 0,
              left: 0,
              position: "absolute",
              top: 0,
              width: "4px",
            }}
          />
        ) : null}
        {/* 원글 영역 */}
        <div style={{ padding: `${uiSpacing.lg} ${uiSpacing.xl}` }}>
          <div
            style={{
              alignItems: "flex-start",
              display: "flex",
              gap: uiSpacing.sm,
              justifyContent: "space-between",
              marginBottom: uiSpacing.sm,
            }}
          >
            <p
              style={{
                flex: 1,
                fontSize: "11px",
                lineHeight: 1.35,
                margin: 0,
              }}
            >
              <span
                style={{
                  color: uiColors.textStrong,
                  fontWeight: 500,
                }}
              >
                {displayAdministrativeDongName}
              </span>
              <span
                style={{
                  color: uiColors.textMuted,
                  fontWeight: 400,
                }}
              >
                {` · ${formatBucketedDistance(distanceMeters)} · ${relativeTime}`}
              </span>
            </p>

            <button
              aria-label="신고 메뉴 열기"
              data-post-menu-trigger-for={menuPostId}
              onClick={isMenuOpen ? onCloseMenu : onOpenMenu}
              style={{
                appearance: "none",
                background: "transparent",
                border: "none",
                color: uiColors.textStrong,
                cursor: "pointer",
                flexShrink: 0,
                fontSize: "16px",
                fontWeight: 500,
                lineHeight: 1,
                margin: 0,
                padding: 0,
                textAlign: "right",
                transform: "translateY(-1px)",
              }}
              type="button"
            >
              ⋯
            </button>
          </div>

          <p
            style={{
              color: uiColors.textStrong,
              fontSize: "15px",
              fontWeight: 500,
              lineHeight: 1.5,
              margin: 0,
              paddingBottom: hasReply ? "0" : uiSpacing.xs,
            }}
          >
            {content}
          </p>
        </div>

        {/* 답변 영역 — CandidateMessageCard 스타일 그대로 */}
        {hasReply ? (
          <div
            style={{
              background: uiColors.surface,
              borderTop: `1px solid ${uiColors.border}`,
              display: "flex",
              overflow: "hidden",
            }}
          >
            {/* 프로필 사진 */}
            {replyCandidatePhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={`${replyCandidateName ?? ""} 후보`}
                src={replyCandidatePhotoUrl}
                style={{
                  alignSelf: "flex-end",
                  display: "block",
                  flexShrink: 0,
                  height: "76px",
                  width: "auto",
                }}
              />
            ) : (
              <div
                style={{
                  alignItems: "center",
                  alignSelf: "flex-end",
                  background: "#e5e7eb",
                  borderRadius: "50%",
                  display: "flex",
                  flexShrink: 0,
                  height: "72px",
                  justifyContent: "center",
                  margin: "0 8px 0",
                  width: "72px",
                }}
              >
                <span style={{ color: "#6b7280", fontSize: "22px", fontWeight: 700 }}>
                  {replyCandidateName?.slice(-1) ?? "?"}
                </span>
              </div>
            )}

            {/* 태그·이름·본문 */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                padding: `${uiSpacing.lg} ${uiSpacing.xl}`,
              }}
            >
              {/* 메타 행: 이름 · 선거구 + 의회 태그 */}
              <p
                style={{
                  alignItems: "center",
                  display: "flex",
                  flexWrap: "wrap",
                  fontSize: "11px",
                  gap: "6px",
                  lineHeight: 1.35,
                  margin: `0 0 ${uiSpacing.sm}`,
                }}
              >
                <span style={{ color: uiColors.textStrong, fontWeight: 500 }}>
                  {replyNameLabel}
                </span>
                {replyDistrictLabel ? (
                  <span style={{ color: uiColors.textStrong, fontWeight: 500 }}>
                    · {replyDistrictLabel}
                  </span>
                ) : null}
                <span
                  style={{
                    background: uiBrandYellow.surfaceWarm,
                    border: `1px solid ${uiBrandYellow.borderWarm}`,
                    borderRadius: "999px",
                    color: uiColors.textStrong,
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "2px 8px",
                  }}
                >
                  {replyCouncilBadge
                    ? `${replyCouncilBadge.replace(/의회$/, "의원")} 후보`
                    : "후보"}
                </span>
                {replyIsPromise ? (
                  <span
                    style={{
                      background: "#fbbf24",
                      borderRadius: "999px",
                      color: "#78350f",
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "2px 6px",
                    }}
                  >
                    약속
                  </span>
                ) : null}
              </p>
              {/* 답변 본문 */}
              <p
                style={{
                  color: uiColors.textStrong,
                  fontSize: "15px",
                  fontWeight: 500,
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {replyContent}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
