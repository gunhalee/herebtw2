export type GridLevel =
  | "nation"
  | "sido"
  | "sigungu"
  | "dong";

export type GridSelection = {
  selectedGridLevel: GridLevel;
  selectedGridCellPath: string | null;
  selectedDongCode: string | null;
  selectedDongName: string | null;
};

export type GridCellSummary = {
  gridCellPath: string;
  label: string;
  activePostCount: number;
  selected: boolean;
};
