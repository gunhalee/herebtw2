import type { GridLevel } from "../../types/grid";

export type ResolveGridCellResult = {
  selectedGridLevel: GridLevel;
  selectedGridCellPath: string;
};

export async function resolveGridCell(
  administrativeDongCode: string,
): Promise<ResolveGridCellResult> {
  return {
    selectedGridLevel: "dong",
    selectedGridCellPath:
      administrativeDongCode === "11680640"
        ? "nation.seoul.gangnam.yeoksam1"
        : `nation.unknown.${administrativeDongCode}`,
  };
}
