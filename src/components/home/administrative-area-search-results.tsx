import type { ManualAdministrativeLocationSelection } from "../../lib/geo/administrative-dong-search";
import {
  uiBrandYellow,
  uiColors,
  uiRadius,
  uiSpacing,
  uiTypography,
} from "../../lib/ui/tokens";

type AdministrativeAreaSearchResultsProps = {
  errorMessage: string | null;
  query: string;
  results: ManualAdministrativeLocationSelection[];
  searching: boolean;
  onSelect: (selection: ManualAdministrativeLocationSelection) => void;
};

function getScopeLabel(
  scope: ManualAdministrativeLocationSelection["locationScope"],
) {
  if (scope === "province") {
    return "시·도";
  }

  if (scope === "district") {
    return "시·군·구";
  }

  return "동·읍·면";
}

export function AdministrativeAreaSearchResults({
  errorMessage,
  query,
  results,
  searching,
  onSelect,
}: AdministrativeAreaSearchResultsProps) {
  const normalizedQuery = query.trim();
  const showEmptyResults =
    normalizedQuery.length >= 2 &&
    !searching &&
    !errorMessage &&
    results.length === 0;

  return (
    <div
      aria-live="polite"
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        minHeight: "132px",
        overflowY: "auto",
        overscrollBehavior: "contain",
      }}
    >
      {normalizedQuery.length < 2 ? (
        <div
          style={{
            color: uiColors.textMuted,
            fontSize: uiTypography.body.fontSize,
            lineHeight: 1.6,
            padding: `${uiSpacing.xxl} ${uiSpacing.xs}`,
            textAlign: "center",
          }}
        >
          동네 이름을 두 글자 이상 입력해 주세요.
          <br />
          같은 이름이 많다면 시·군·구를 함께 입력해 주세요.
        </div>
      ) : null}

      {searching ? (
        <p
          style={{
            color: uiColors.textMuted,
            fontSize: uiTypography.body.fontSize,
            margin: 0,
            padding: uiSpacing.xxl,
            textAlign: "center",
          }}
        >
          지역을 찾고 있어요...
        </p>
      ) : null}

      {errorMessage ? (
        <p
          style={{
            color: uiColors.danger,
            fontSize: uiTypography.body.fontSize,
            lineHeight: 1.5,
            margin: 0,
            padding: uiSpacing.xxl,
            textAlign: "center",
          }}
        >
          {errorMessage}
        </p>
      ) : null}

      {showEmptyResults ? (
        <p
          style={{
            color: uiColors.textMuted,
            fontSize: uiTypography.body.fontSize,
            lineHeight: 1.5,
            margin: 0,
            padding: uiSpacing.xxl,
            textAlign: "center",
          }}
        >
          검색 결과가 없어요. 더 큰 지역 단위를 입력해주세요.
          <br />
          예: 성수1가1동 → 서울 성동구
        </p>
      ) : null}

      {results.map((result) => (
        <button
          key={`${result.locationScope}:${result.administrativeAreaCode}`}
          onClick={() => onSelect(result)}
          style={{
            alignItems: "center",
            appearance: "none",
            background: "transparent",
            border: 0,
            borderBottom: `1px solid ${uiColors.border}`,
            color: uiColors.textStrong,
            cursor: "pointer",
            display: "flex",
            gap: uiSpacing.sm,
            justifyContent: "space-between",
            minHeight: "56px",
            padding: `${uiSpacing.sm} ${uiSpacing.xs}`,
            textAlign: "left",
            width: "100%",
          }}
          type="button"
        >
          <span
            style={{
              fontSize: "15px",
              fontWeight: 650,
              lineHeight: 1.4,
            }}
          >
            {result.formattedAdministrativeAreaName}
          </span>
          <span
            style={{
              background: uiBrandYellow.surfaceWarm,
              border: `1px solid ${uiBrandYellow.borderWarm}`,
              borderRadius: uiRadius.pill,
              color: uiColors.textBody,
              flexShrink: 0,
              fontSize: "10px",
              fontWeight: 700,
              padding: "4px 7px",
            }}
          >
            {getScopeLabel(result.locationScope)}
          </span>
        </button>
      ))}
    </div>
  );
}
