import {
  uiColors,
  uiRadius,
  uiShadow,
  uiSpacing,
} from "../../lib/ui/tokens";

export type GridCellProps = {
  gridCellPath?: string;
  label?: string;
  activePostCount?: number;
  selected?: boolean;
  onSelect?: (gridCellPath: string) => void;
};

export function GridCell({
  gridCellPath = "nation.seoul.gangnam.yeoksam1",
  label = "역삼1동",
  activePostCount = 0,
  selected = false,
  onSelect,
}: GridCellProps) {
  const markerColor = selected
    ? uiColors.markerPrimary
    : activePostCount > 2
      ? uiColors.markerDark
      : activePostCount > 0
        ? uiColors.markerWarm
        : uiColors.markerPrimary;

  return (
    <button
      aria-pressed={selected}
      onClick={() => onSelect?.(gridCellPath)}
      style={{
        alignItems: "center",
        aspectRatio: "1 / 1",
        background: selected ? uiColors.surfaceMapSelected : uiColors.surfaceMapTile,
        border: "none",
        borderRadius: uiRadius.md,
        boxShadow: selected ? uiShadow.cardSelected : "none",
        display: "flex",
        justifyContent: "center",
        overflow: "hidden",
        padding: uiSpacing.md,
        position: "relative",
        width: "100%",
      }}
      type="button"
    >
      <span
        aria-hidden="true"
        style={{
          background: markerColor,
          borderRadius: "50% 50% 50% 0",
          boxShadow: uiShadow.floating,
          display: "block",
          height: selected ? "34px" : "28px",
          transform: "rotate(-45deg)",
          width: selected ? "34px" : "28px",
        }}
      />
      <span
        aria-hidden="true"
        style={{
          background: uiColors.textInverse,
          borderRadius: "50%",
          height: selected ? "10px" : "8px",
          left: "50%",
          marginLeft: selected ? "-5px" : "-4px",
          marginTop: selected ? "-5px" : "-4px",
          position: "absolute",
          top: "50%",
          width: selected ? "10px" : "8px",
        }}
      />
      <span
        style={{
          bottom: uiSpacing.sm,
          color: uiColors.textMuted,
          fontSize: "11px",
          fontWeight: 700,
          left: uiSpacing.sm,
          position: "absolute",
        }}
      >
        {selected ? label : activePostCount > 0 ? `${activePostCount}개` : ""}
      </span>
    </button>
  );
}
