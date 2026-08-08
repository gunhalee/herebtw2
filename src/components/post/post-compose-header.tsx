import { uiColors, uiSpacing } from "../../lib/ui/tokens";

type PostComposeHeaderProps = {
  locationDisplayName: string | null;
  submitDisabled: boolean;
  submitting: boolean;
  onChangeLocation?: () => void;
  onDismiss?: () => void;
};

export function PostComposeHeader({
  locationDisplayName,
  submitDisabled,
  submitting,
  onChangeLocation,
  onDismiss,
}: PostComposeHeaderProps) {
  return (
    <div
      style={{
        alignItems: "center",
        display: "grid",
        gridTemplateColumns: "48px minmax(0, 1fr) 48px",
        width: "100%",
      }}
    >
      <button
        aria-label="작성 취소"
        onClick={onDismiss}
        style={{
          alignItems: "center",
          appearance: "none",
          background: "transparent",
          border: "none",
          borderRadius: "999px",
          color: uiColors.textMuted,
          cursor: "pointer",
          display: "inline-flex",
          fontSize: "18px",
          fontWeight: 700,
          height: "40px",
          justifyContent: "center",
          justifySelf: "start",
          padding: 0,
          width: "40px",
        }}
        type="button"
      >
        <span aria-hidden="true">×</span>
      </button>

      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: "6px",
          justifyContent: "center",
          justifySelf: "center",
          minWidth: 0,
          width: "100%",
        }}
      >
        <h2
          style={{
            color: uiColors.textStrong,
            fontSize: "17px",
            lineHeight: 1.2,
            margin: 0,
            minWidth: 0,
            overflow: "hidden",
            textAlign: "center",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {locationDisplayName
            ? `${locationDisplayName}에 남기기`
            : "위치 확인 중..."}
        </h2>
        {onChangeLocation ? (
          <button
            aria-label={`${locationDisplayName ?? "현재 지역"} 변경`}
            onClick={onChangeLocation}
            style={{
              appearance: "none",
              background: "transparent",
              border: 0,
              color: uiColors.buttonPrimary,
              cursor: "pointer",
              flexShrink: 0,
              fontSize: "11px",
              fontWeight: 700,
              minHeight: "32px",
              padding: 0,
            }}
            type="button"
          >
            지역 변경
          </button>
        ) : null}
      </div>

      <button
        disabled={submitDisabled}
        style={{
          appearance: "none",
          background: "transparent",
          border: "none",
          color: submitDisabled ? "#9ca3af" : uiColors.buttonPrimary,
          cursor: submitDisabled ? "default" : "pointer",
          fontSize: "18px",
          fontWeight: 700,
          justifySelf: "end",
          minHeight: "40px",
          padding: `${uiSpacing.xs} ${uiSpacing.xs}`,
        }}
        type="submit"
      >
        {submitting ? "등록 중..." : "등록"}
      </button>
    </div>
  );
}
