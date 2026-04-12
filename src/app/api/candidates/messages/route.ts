import { ok } from "../../../../lib/api/response";
import { loadCandidateMessages } from "../../../../lib/candidates/messages";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dongCode = searchParams.get("dongCode") ?? null;

  try {
    const result = await loadCandidateMessages(dongCode);
    return ok(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/candidates/messages] error:", message);
    return ok({ candidates: [], userDistricts: null });
  }
}
