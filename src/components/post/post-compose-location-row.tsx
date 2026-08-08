import { uiColors, uiSpacing, uiTypography } from "../../lib/ui/tokens";

type PostComposeLocationRowProps = {
  locationDisplayName: string | null;
  onChangeLocation?: () => void;
};

export function PostComposeLocationRow({
  locationDisplayName,
  onChangeLocation,
}: PostComposeLocationRowProps) {
  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        gap: uiSpacing.sm,
        justifyContent: "center",
        margin: `-${uiSpacing.xs} 0 0`,
      }}
    >
      <p
        style={{
          color: uiColors.textMuted,
          fontSize: uiTypography.meta.fontSize,
          fontWeight: 600,
          lineHeight: 1.4,
          margin: 0,
          textAlign: "center",
        }}
      >
        {locationDisplayName
          ? `${locationDisplayName}에 남겨요`
          : "위치 확인 중..."}
      </p>
      {onChangeLocation ? (
        <button
          onClick={onChangeLocation}
          style={{
            appearance: "none",
            background: "transparent",
            border: 0,
            color: uiColors.buttonPrimary,
            cursor: "pointer",
            fontSize: "11px",
            fontWeight: 700,
            minHeight: "28px",
            padding: `0 ${uiSpacing.xs}`,
          }}
          type="button"
        >
          지역 변경
        </button>
      ) : null}
    </div>
  );
}
