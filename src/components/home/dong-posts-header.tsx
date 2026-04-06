import Image from "next/image";
import penWritingImage from "../pen_writing.png";
import { homeScreenCopy } from "../../lib/content/home-copy";
import { uiColors, uiRadius, uiSpacing } from "../../lib/ui/tokens";
import {
  COMPOSE_DONG_PLACEHOLDER_LABEL,
  ComposeDongFlashcard,
} from "./compose-dong-flashcard";

type DongPostsHeaderProps = {
  currentDongName: string;
  animateComposeDongPlaceholder?: boolean;
  runtimeNotice?: string | null;
  onCompose?: () => void;
};

export function DongPostsHeader({
  currentDongName,
  animateComposeDongPlaceholder = false,
  runtimeNotice,
  onCompose,
}: DongPostsHeaderProps) {
  const composeCta = homeScreenCopy.composeCta(currentDongName);
  const shouldAnimatePlaceholderDong =
    animateComposeDongPlaceholder ||
    composeCta.location === COMPOSE_DONG_PLACEHOLDER_LABEL;

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
        padding: `calc(env(safe-area-inset-top, 0px) + ${uiSpacing.pageY}) ${uiSpacing.pageX} ${uiSpacing.xxl}`,
        position: "relative",
        zIndex: 2,
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          gap: uiSpacing.xs,
          textAlign: "center",
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
      </div>

      {runtimeNotice ? (
        <div
          style={{
            background: "#fff7ed",
            border: "1px solid #fdba74",
            borderRadius: uiRadius.md,
            color: "#9a3412",
            fontSize: "12px",
            lineHeight: 1.5,
            padding: `${uiSpacing.sm} ${uiSpacing.md}`,
          }}
        >
          {runtimeNotice}
        </div>
      ) : null}

      <button
        onClick={onCompose}
        style={{
          alignItems: "center",
          background: "linear-gradient(180deg, #fffdfa 0%, #f8f2e8 100%)",
          border: "1px solid #e7dccd",
          borderRadius: uiRadius.pill,
          boxShadow:
            "0 14px 28px rgba(116, 94, 62, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
          color: uiColors.textStrong,
          cursor: "pointer",
          display: "grid",
          fontSize: "16px",
          fontWeight: 700,
          gridTemplateColumns: "30px minmax(0, 1fr) 30px",
          lineHeight: 1.35,
          padding: `${uiSpacing.lg} ${uiSpacing.xl}`,
          transform: "translateY(-1px)",
          width: "100%",
        }}
        type="button"
      >
        <span
          aria-hidden="true"
          style={{
            display: "inline-block",
            height: "30px",
            width: "30px",
          }}
        />
        <span
          style={{
            alignItems: "center",
            display: "flex",
            gap: "0.04em",
            justifyContent: "center",
            justifySelf: "stretch",
            minWidth: 0,
            textAlign: "center",
            width: "100%",
          }}
        >
          <span
            style={{
              color: uiColors.textMuted,
            }}
          >
            {composeCta.prefix}
          </span>
          <ComposeDongFlashcard
            animatePlaceholder={shouldAnimatePlaceholderDong}
            label={composeCta.location}
          />
          <span
            style={{
              color: uiColors.textMuted,
            }}
          >
            {composeCta.suffix}
          </span>
        </span>
        <span
          style={{
            display: "inline-flex",
            justifySelf: "end",
            transform: "translateX(-2px)",
          }}
        >
          <Image alt="" src={penWritingImage} width={20} height={20} />
        </span>
      </button>
    </header>
  );
}
