import type {
  CandidateMessage,
  CandidateMessagesPayload,
} from "../../lib/candidates/messages";
import { homeScreenCopy } from "../../lib/content/home-copy";
import { formatAdministrativeAreaNameForHomeDisplay } from "../../lib/geo/format-administrative-area";
import { formatBucketedDistance } from "../../lib/geo/format-bucketed-distance";
import { getSupabaseRenderImageUrl } from "../../lib/supabase/storage";
import type { PostListItem, PostListState } from "../../types/post";
import {
  uiBrandYellow,
  uiColors,
  uiRadius,
  uiSpacing,
} from "../../lib/ui/tokens";
import checkmarkIcon from "../checkmark-floating.svg";
import thumbsUpImage from "../thumbs_up.png";
import { DongPostsFeedVeil } from "./dong-posts-feed-veil";

const HOME_FALLBACK_DONG_NAME = "우리 동네";
const LOCAL_COUNCIL_LABEL = "기초의회";
const METRO_COUNCIL_LABEL = "광역의회";
const CANDIDATE_PHOTO_WIDTH = 57;
const CANDIDATE_PHOTO_HEIGHT = 76;
const CANDIDATE_PHOTO_REQUEST_WIDTH = CANDIDATE_PHOTO_WIDTH * 2;
const CANDIDATE_PHOTO_REQUEST_HEIGHT = CANDIDATE_PHOTO_HEIGHT * 2;

function buildCandidateRepliesPath(candidateId: string) {
  return `/voices/candidate/${encodeURIComponent(candidateId)}`;
}

function getComposeDongName(currentDongName: string | null) {
  const trimmed = currentDongName?.trim();
  return trimmed ? trimmed : HOME_FALLBACK_DONG_NAME;
}

function StaticHomeHeader({
  currentDongName,
}: {
  currentDongName: string | null;
}) {
  const composeCta = homeScreenCopy.composeCta(getComposeDongName(currentDongName));
  const composePrefix = composeCta.prefix.trimEnd();
  const composeSuffix = composeCta.suffix.trimStart();

  return (
    <header
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.94))",
        boxShadow: "0 8px 14px rgba(17, 24, 39, 0.08)",
        display: "flex",
        flexDirection: "column",
        gap: uiSpacing.md,
        padding: `${uiSpacing.pageY} ${uiSpacing.pageX} 0`,
        position: "relative",
        zIndex: 2,
      }}
    >
      <a
        aria-label="메인 화면으로 이동"
        href="/"
        style={{
          alignItems: "center",
          color: "inherit",
          display: "flex",
          flexDirection: "column",
          gap: uiSpacing.xs,
          textAlign: "center",
          textDecoration: "none",
        }}
      >
        <h1
          style={{
            alignItems: "baseline",
            color: uiColors.textStrong,
            display: "flex",
            flexWrap: "wrap",
            fontSize: "22px",
            fontWeight: 700,
            gap: uiSpacing.sm,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          <span>{homeScreenCopy.title}</span>
          <span
            style={{
              color: uiColors.textMuted,
            }}
          >
            {homeScreenCopy.titleSuffix}
          </span>
        </h1>
      </a>

      <div
        style={{
          alignItems: "center",
          background: "#ffed00",
          color: "#000000",
          display: "flex",
          fontSize: "16px",
          fontWeight: 700,
          justifyContent: "center",
          lineHeight: 1.35,
          marginInline: `calc(-1 * ${uiSpacing.pageX})`,
          padding: `${uiSpacing.md} ${uiSpacing.pageX}`,
          width: `calc(100% + ${uiSpacing.pageX} + ${uiSpacing.pageX})`,
        }}
      >
        <span
          style={{
            alignItems: "center",
            display: "flex",
            gap: "0.04em",
            justifyContent: "center",
            minWidth: 0,
            textAlign: "center",
            width: "100%",
          }}
        >
          <span>{composePrefix}</span>
          <span
            style={{
              alignItems: "center",
              background: "#ffffff",
              boxSizing: "border-box",
              borderRadius: "999px",
              color: uiColors.textStrong,
              display: "inline-flex",
              flexShrink: 0,
              height: "1.6em",
              justifyContent: "center",
              lineHeight: 1,
              minWidth: "5.8em",
              padding: "0 0.65em",
              whiteSpace: "nowrap",
            }}
          >
            {composeCta.location}
          </span>
          <span>{composeSuffix}</span>
        </span>
      </div>
    </header>
  );
}

function StaticCandidateDistrictBadge({
  label,
  tier,
}: {
  label: string;
  tier: "local" | "metro";
}) {
  const isLocal = tier === "local";

  return (
    <span
      style={{
        background: isLocal ? "#f0fdf4" : "#eff6ff",
        border: `1px solid ${isLocal ? "#bbf7d0" : "#bfdbfe"}`,
        borderRadius: "999px",
        color: isLocal ? "#15803d" : "#1d4ed8",
        fontSize: "11px",
        fontWeight: 700,
        padding: "3px 10px",
      }}
    >
      {`${isLocal ? LOCAL_COUNCIL_LABEL : METRO_COUNCIL_LABEL} ${label}`}
    </span>
  );
}

function StaticCandidateMessageCard({
  candidate,
}: {
  candidate: CandidateMessage;
}) {
  const candidatePhotoUrl = getSupabaseRenderImageUrl(candidate.photoUrl, {
    width: CANDIDATE_PHOTO_REQUEST_WIDTH,
    height: CANDIDATE_PHOTO_REQUEST_HEIGHT,
    quality: 70,
    resize: "cover",
  });
  const districtLabel =
    candidate.localCouncilDistrict ??
    candidate.metroCouncilDistrict ??
    candidate.district;
  const councilBadgeLabel =
    candidate.councilType != null && candidate.councilType.trim()
      ? `${candidate.councilType} 후보`
      : "후보";

  return (
    <a
      href={buildCandidateRepliesPath(candidate.id)}
      style={{
        color: "inherit",
        display: "block",
        textDecoration: "none",
        width: "100%",
      }}
    >
      <div
        style={{
          background: uiColors.surface,
          border: "1px solid rgba(17, 24, 39, 0.08)",
          borderRadius: "22px",
          boxShadow: "0 2px 8px rgba(17, 24, 39, 0.04)",
          boxSizing: "border-box",
          display: "flex",
          overflow: "hidden",
          position: "relative",
          width: "100%",
        }}
      >
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
        {candidatePhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={`${candidate.name} 후보`}
            decoding="async"
            height={CANDIDATE_PHOTO_HEIGHT}
            src={candidatePhotoUrl}
            width={CANDIDATE_PHOTO_WIDTH}
            style={{
              alignSelf: "flex-end",
              display: "block",
              flexShrink: 0,
              height: `${CANDIDATE_PHOTO_HEIGHT}px`,
              objectFit: "cover",
              width: `${CANDIDATE_PHOTO_WIDTH}px`,
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
              {candidate.name.slice(-1)}
            </span>
          </div>
        )}

        <div
          style={{
            color: uiColors.textStrong,
            flex: 1,
            minWidth: 0,
            padding: `${uiSpacing.lg} ${uiSpacing.xl}`,
          }}
        >
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
              {candidate.name}
            </span>
            <span style={{ color: uiColors.textStrong, fontWeight: 500 }}>
              {`· ${districtLabel}`}
            </span>
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
              {councilBadgeLabel}
            </span>
          </p>

          <p
            style={{
              color: uiColors.textStrong,
              fontSize: "15px",
              fontWeight: 500,
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {candidate.firstMessageContent}
          </p>
        </div>
      </div>
    </a>
  );
}

function StaticCandidateMessagesSection({
  dongCode,
  initialData,
}: {
  dongCode?: string | null;
  initialData?: CandidateMessagesPayload | null;
}) {
  if (!dongCode || !initialData?.candidates.length) {
    return null;
  }

  const { candidates, userDistricts } = initialData;

  return (
    <div
      style={{
        borderBottom: `1px solid ${uiColors.border}`,
        display: "flex",
        flexDirection: "column",
        gap: uiSpacing.md,
        marginBottom: uiSpacing.sm,
        marginLeft: `-${uiSpacing.pageX}`,
        marginRight: `-${uiSpacing.pageX}`,
        paddingBottom: uiSpacing.md,
        paddingLeft: uiSpacing.pageX,
        paddingRight: uiSpacing.pageX,
      }}
    >
      {userDistricts &&
      (userDistricts.localCouncilDistrict || userDistricts.metroCouncilDistrict) ? (
        <div
          style={{
            alignItems: "center",
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
          }}
        >
          <span
            style={{
              color: uiColors.textMuted,
              fontSize: "11px",
              fontWeight: 600,
              marginRight: "2px",
            }}
          >
            우리 동네 후보
          </span>
          {userDistricts.localCouncilDistrict ? (
            <StaticCandidateDistrictBadge
              label={userDistricts.localCouncilDistrict}
              tier="local"
            />
          ) : null}
          {userDistricts.metroCouncilDistrict ? (
            <StaticCandidateDistrictBadge
              label={userDistricts.metroCouncilDistrict}
              tier="metro"
            />
          ) : null}
        </div>
      ) : null}

      {candidates.map((candidate) => (
        <StaticCandidateMessageCard key={candidate.id} candidate={candidate} />
      ))}
    </div>
  );
}

function StaticFeedLoadMoreButton() {
  return (
    <button
      style={{
        appearance: "none",
        background: uiBrandYellow.surfaceSoft,
        border: `1px solid ${uiBrandYellow.borderSoft}`,
        borderRadius: uiRadius.pill,
        color: uiBrandYellow.textOnCta,
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: 700,
        padding: `${uiSpacing.md} ${uiSpacing.lg}`,
        width: "100%",
      }}
      type="button"
    >
      더 보기
    </button>
  );
}

function StaticPostListCard({
  item,
}: {
  item: PostListItem;
}) {
  const displayAdministrativeDongName = formatAdministrativeAreaNameForHomeDisplay(
    item.administrativeDongName,
  );
  const hasReply = item.replyStatus === "replied" && Boolean(item.replyContent);
  const replyCandidatePortraitUrl = getSupabaseRenderImageUrl(item.replyCandidatePhotoUrl, {
    width: CANDIDATE_PHOTO_REQUEST_WIDTH,
    height: CANDIDATE_PHOTO_REQUEST_HEIGHT,
    quality: 70,
    resize: "cover",
  });
  const replyCouncilBadgeLabel =
    item.replyCandidateCouncilType?.trim() ||
    (item.replyCandidateLocalCouncilDistrict ? LOCAL_COUNCIL_LABEL : null);

  return (
    <article
      data-highlighted={item.isHighlighted}
      style={{
        alignItems: "stretch",
        display: "flex",
        flexDirection: "column",
        gap: uiSpacing.xs,
        position: "relative",
      }}
    >
      <div
        style={{
          alignSelf: "stretch",
          paddingBottom: "10px",
          position: "relative",
          width: "100%",
        }}
      >
        <button
          style={{
            alignItems: "center",
            background: item.myAgree
              ? uiBrandYellow.surfaceWarm
              : "rgba(255, 255, 255, 0.96)",
            border: `1px solid ${
              item.myAgree ? uiBrandYellow.borderWarm : uiColors.border
            }`,
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
          <img alt="" src={thumbsUpImage.src} width={14} height={14} decoding="async" />
          <span
            style={{
              color: item.myAgree ? uiColors.textStrong : uiColors.textMuted,
              fontSize: "12px",
              fontWeight: 600,
              lineHeight: 1,
            }}
          >
            {item.agreeCount}
          </span>
        </button>

        <div
          style={{
            background: uiColors.surface,
            border: item.isHighlighted
              ? "1px solid rgba(17, 24, 39, 0.14)"
              : "1px solid rgba(17, 24, 39, 0.08)",
            borderRadius: "22px",
            boxShadow: item.isHighlighted
              ? "0 4px 12px rgba(17, 24, 39, 0.07)"
              : "0 2px 8px rgba(17, 24, 39, 0.04)",
            boxSizing: "border-box",
            color: uiColors.textStrong,
            overflow: "hidden",
            position: "relative",
            width: "100%",
          }}
        >
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
                  {` · ${formatBucketedDistance(item.distanceMeters)} · ${item.relativeTime}`}
                </span>
              </p>

              <button
                aria-label="신고 메뉴 열기"
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
                ...
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
              {item.content}
            </p>
          </div>

          {hasReply ? (
            <div
              style={{
                background: uiColors.surface,
                borderTop: `1px solid ${uiColors.border}`,
                display: "flex",
                overflow: "hidden",
              }}
            >
              {replyCandidatePortraitUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={`${item.replyCandidateName ?? ""} 후보`}
                  decoding="async"
                  height={CANDIDATE_PHOTO_HEIGHT}
                  src={replyCandidatePortraitUrl}
                  width={CANDIDATE_PHOTO_WIDTH}
                  style={{
                    alignSelf: "flex-end",
                    display: "block",
                    flexShrink: 0,
                    height: `${CANDIDATE_PHOTO_HEIGHT}px`,
                    objectFit: "cover",
                    width: `${CANDIDATE_PHOTO_WIDTH}px`,
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
                    {item.replyCandidateName?.slice(-1) ?? "?"}
                  </span>
                </div>
              )}

              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: `${uiSpacing.lg} ${uiSpacing.xl}`,
                }}
              >
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
                    {item.replyCandidateName?.trim() ?? ""}
                  </span>
                  {item.replyCandidateLocalCouncilDistrict ? (
                    <span style={{ color: uiColors.textStrong, fontWeight: 500 }}>
                      {`· ${item.replyCandidateLocalCouncilDistrict.trim()}`}
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
                    {replyCouncilBadgeLabel
                      ? `${replyCouncilBadgeLabel.replace(/의회$/, "의원")} 후보`
                      : "후보"}
                  </span>
                  {item.replyIsPromise ? (
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
                <p
                  style={{
                    color: uiColors.textStrong,
                    fontSize: "15px",
                    fontWeight: 500,
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {item.replyContent}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function StaticHomeFeedContent({
  state,
  shouldObscurePosts,
}: {
  state: PostListState;
  shouldObscurePosts: boolean;
}) {
  if (state.empty) {
    return (
      <section
        style={{
          background: "#f7f4ec",
          border: `1px solid ${uiColors.border}`,
          borderRadius: uiRadius.md,
          display: "flex",
          flexDirection: "column",
          gap: uiSpacing.xs,
          padding: uiSpacing.lg,
        }}
      >
        <h3
          style={{
            color: uiColors.textStrong,
            fontSize: "15px",
            fontWeight: 700,
            lineHeight: 1.3,
            margin: 0,
          }}
        >
          {homeScreenCopy.emptyTitle}
        </h3>
        {homeScreenCopy.emptyDescription ? (
          <p
            style={{
              color: uiColors.textMuted,
              fontSize: "13px",
              margin: 0,
            }}
          >
            {homeScreenCopy.emptyDescription}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: uiSpacing.md,
      }}
    >
      {state.items.map((item) => (
        <div
          data-post-id={item.id}
          key={item.id}
          className={shouldObscurePosts ? "global-feed-preview__card" : undefined}
          style={{
            position: "relative",
          }}
        >
          <StaticPostListCard item={item} />
        </div>
      ))}
      {state.nextCursor ? <StaticFeedLoadMoreButton /> : null}
    </div>
  );
}

function StaticFloatingComposeButton() {
  return (
    <button
      aria-label="글 올리기"
      style={{
        alignItems: "center",
        appearance: "none",
        backdropFilter: "blur(10px)",
        background: "linear-gradient(180deg, #fff89a 0%, #ffed00 100%)",
        border: "1px solid #e7dccd",
        borderRadius: uiRadius.pill,
        bottom: `calc(20px + env(safe-area-inset-bottom, 0px))`,
        boxShadow:
          "0 18px 34px rgba(116, 94, 62, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.92)",
        cursor: "pointer",
        display: "inline-flex",
        gap: uiSpacing.xs,
        height: "54px",
        justifyContent: "center",
        padding: `0 ${uiSpacing.md} 0 ${uiSpacing.lg}`,
        position: "absolute",
        right: uiSpacing.pageX,
        zIndex: 12,
      }}
      type="button"
    >
      <span
        style={{
          color: uiColors.textStrong,
          fontSize: "14px",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          position: "relative",
          whiteSpace: "nowrap",
          zIndex: 1,
        }}
      >
        글 올리기
      </span>
      <img
        alt=""
        aria-hidden="true"
        src={checkmarkIcon.src}
        width={18}
        height={18}
        decoding="async"
        style={{
          filter:
            "drop-shadow(0 0 0.75px rgba(55, 48, 0, 0.55)) drop-shadow(0 2px 6px rgba(17, 24, 39, 0.18))",
          position: "relative",
          zIndex: 1,
        }}
      />
    </button>
  );
}

export function HomeStaticScreen({
  candidateMessages,
  currentDongName,
  postListState,
  selectedDongCode,
}: {
  candidateMessages: CandidateMessagesPayload | null;
  currentDongName: string | null;
  postListState: PostListState;
  selectedDongCode: string | null;
}) {
  const shouldObscurePosts =
    postListState.sort === "latest" &&
    !postListState.loading &&
    !postListState.errorMessage &&
    !postListState.empty;

  return (
    <div
      style={{
        background: "#ffffff",
        height: "100dvh",
        inset: 0,
        overflow: "hidden",
        position: "fixed",
        width: "100%",
      }}
    >
      <section
        aria-label="nearby-posts-screen"
        style={{
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <StaticHomeHeader currentDongName={currentDongName} />

        <div
          style={{
            background: uiColors.surface,
            display: "flex",
            flex: 1,
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              background: uiColors.surface,
              display: "flex",
              flexDirection: "column",
              gap: uiSpacing.md,
              minHeight: 0,
              overflowY: "auto",
              overscrollBehaviorY: "contain",
              padding: `${uiSpacing.lg} ${uiSpacing.pageX} calc(108px + env(safe-area-inset-bottom, 0px))`,
              position: "relative",
              touchAction: "pan-y",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <StaticCandidateMessagesSection
              dongCode={selectedDongCode}
              initialData={candidateMessages}
            />
            <div
              className="global-feed-preview"
              data-obscured={shouldObscurePosts ? "true" : undefined}
              style={{
                position: "relative",
              }}
            >
              <div
                className={
                  shouldObscurePosts ? "global-feed-preview__content" : undefined
                }
              >
                <StaticHomeFeedContent
                  shouldObscurePosts={shouldObscurePosts}
                  state={postListState}
                />
              </div>
              {shouldObscurePosts ? <DongPostsFeedVeil /> : null}
            </div>
          </div>
        </div>

        <StaticFloatingComposeButton />
      </section>
    </div>
  );
}
