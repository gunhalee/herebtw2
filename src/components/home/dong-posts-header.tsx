import Link from "next/link";
import { memo, type Ref } from "react";
import { homeScreenCopy } from "../../lib/content/home-copy";
import { uiColors, uiSpacing } from "../../lib/ui/tokens";
import { ComposeDongFlashcard } from "./compose-dong-flashcard";

type DongPostsHeaderProps = {
  currentDongName: string;
  animateComposeDongPlaceholder?: boolean;
  titleLineRef?: Ref<HTMLHeadingElement>;
  shrinkTitleToIntrinsicWidth?: boolean;
};

function StaticComposeDongBadge({
  label,
}: {
  label: string;
}) {
  return (
    <span
      style={{
        background: "#ffffff",
        boxSizing: "border-box",
        borderRadius: "999px",
        color: uiColors.textStrong,
        display: "inline-flex",
        alignItems: "center",
        flexShrink: 0,
        height: "1.6em",
        justifyContent: "center",
        lineHeight: 1,
        minWidth: "4.25em",
        padding: "0 0.65em",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

export const DongPostsHeader = memo(function DongPostsHeader({
  currentDongName,
  animateComposeDongPlaceholder = false,
  titleLineRef,
  shrinkTitleToIntrinsicWidth = false,
}: DongPostsHeaderProps) {
  const composeCta = homeScreenCopy.composeCta(currentDongName);

  return (
    <header
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.94))",
        backdropFilter: "blur(10px)",
        boxShadow: "0 8px 14px rgba(17, 24, 39, 0.08)",
        display: "flex",
        flexDirection: "column",
        gap: uiSpacing.md,
        padding: `calc(env(safe-area-inset-top, 0px) + ${uiSpacing.pageY}) ${uiSpacing.pageX} 0`,
        position: "relative",
        zIndex: 2,
      }}
    >
      <Link
        aria-label="Go home"
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
          ref={titleLineRef}
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
            ...(shrinkTitleToIntrinsicWidth
              ? {
                  marginLeft: "auto",
                  marginRight: "auto",
                  maxWidth: "100%",
                  width: "fit-content",
                }
              : {}),
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
        {homeScreenCopy.eyebrow ? (
          <span
            style={{
              color: uiColors.textStrong,
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}
          >
            {homeScreenCopy.eyebrow}
          </span>
        ) : null}
        {homeScreenCopy.subtitle ? (
          <p
            style={{
              color: uiColors.textMuted,
              fontSize: "13px",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {homeScreenCopy.subtitle}
          </p>
        ) : null}
      </Link>

      <div
        style={{
          alignItems: "center",
          background: "#ffed00",
          borderRadius: 0,
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
          <span
            style={{
              color: "#000000",
            }}
          >
            {composeCta.prefix}
          </span>
          {animateComposeDongPlaceholder ? (
            <ComposeDongFlashcard
              animatePlaceholder
              label={composeCta.location}
            />
          ) : (
            <StaticComposeDongBadge label={composeCta.location} />
          )}
          <span
            style={{
              color: "#000000",
            }}
          >
            {composeCta.suffix}
          </span>
        </span>
      </div>
    </header>
  );
});
