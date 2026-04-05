import { ok } from "../../../../lib/api/response";
import { loadGridSummaryRepository } from "../../../../lib/posts/repository";

type GridSummaryRequest = {
  level: string;
  viewport: {
    gridCellPaths: string[];
  };
};

export async function POST(request: Request) {
  const body = (await request.json()) as GridSummaryRequest;
  const cells = await loadGridSummaryRepository({
    gridCellPaths: body.viewport.gridCellPaths,
  });

  return ok({ cells });
}
