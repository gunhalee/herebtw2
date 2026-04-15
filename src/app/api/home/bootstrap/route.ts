import { ok } from "../../../../lib/api/response";
import { getInteractiveHomeBootstrapState } from "../../../../lib/posts/queries";

export async function GET() {
  const data = await getInteractiveHomeBootstrapState();

  return ok(data, {
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}
