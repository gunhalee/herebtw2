import type { GridCellSummary } from "../../types/grid";
import {
  uiColors,
  uiRadius,
  uiSpacing,
} from "../../lib/ui/tokens";
import { GridCell } from "./grid-cell";
import {
  GridBreadcrumb,
  type GridBreadcrumbItem,
} from "./grid-breadcrumb";

export type RegionGridProps = {
  title?: string;
  description?: string;
  helperText?: string;
  breadcrumbItems?: GridBreadcrumbItem[];
  cells: GridCellSummary[];
  onBack?: () => void;
  onSelectCell?: (gridCellPath: string) => void;
};

export function RegionGrid({
  title = "강남구",
  description = "지역 선택",
  helperText = "원하는 지역을 선택하면 아래에서 해당 지역의 글을 볼 수 있어요.",
  breadcrumbItems = [],
  cells,
  onBack,
  onSelectCell,
}: RegionGridProps) {
  return (
    <section
      aria-label="region-grid"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: uiSpacing.md,
        height: "100%",
        minHeight: 0,
        position: "relative",
      }}
    >
      <header
        style={{
          left: uiSpacing.xl,
          opacity: 1,
          position: "absolute",
          top: uiSpacing.xl,
          zIndex: 2,
        }}
      >
        {onBack ? (
          <button
            onClick={onBack}
            style={{
              background: "rgba(255,255,255,0.82)",
              border: "none",
              borderRadius: uiRadius.pill,
              color: uiColors.textStrong,
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 700,
              marginBottom: uiSpacing.sm,
              padding: `${uiSpacing.sm} ${uiSpacing.md}`,
            }}
            type="button"
          >
            ← 이전 단계
          </button>
        ) : null}
        <GridBreadcrumb items={breadcrumbItems} />
        <h3
          style={{
            color: uiColors.textStrong,
            fontSize: "24px",
            lineHeight: 1.2,
            margin: `${uiSpacing.xs} 0 0`,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            color: uiColors.textMuted,
            fontSize: "13px",
            margin: `${uiSpacing.xs} 0 0`,
          }}
        >
          내 위치 기준 · 반경 2km
        </p>
      </header>

      <div
        style={{
          background: uiColors.surfaceMap,
          borderRadius: uiRadius.xl,
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.55)`,
          filter: "none",
          flex: 1,
          minHeight: "560px",
          overflow: "hidden",
          padding: `${uiSpacing.xxl} ${uiSpacing.md} ${uiSpacing.xxl}`,
          position: "relative",
        }}
      >
        <ul
          style={{
            display: "grid",
            gap: uiSpacing.sm,
            gridTemplateColumns: "repeat(3, 1fr)",
            listStyle: "none",
            margin: "72px 0 0",
            padding: 0,
            position: "relative",
            zIndex: 1,
          }}
        >
          {cells.map((cell) => (
            <li key={cell.gridCellPath}>
              <GridCell {...cell} onSelect={onSelectCell} />
            </li>
          ))}
          {Array.from({ length: Math.max(0, 9 - cells.length) }).map((_, index) => (
            <li key={`empty-${index}`}>
              <div
                style={{
                  aspectRatio: "1 / 1",
                  background: uiColors.surfaceMapTile,
                  borderRadius: uiRadius.md,
                }}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
