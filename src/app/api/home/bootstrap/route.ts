import { ok } from "../../../../lib/api/response";
import { getHomePageState } from "../../../../lib/posts/queries";

export async function GET() {
  const data = await getHomePageState();

  return ok(data, {
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}
