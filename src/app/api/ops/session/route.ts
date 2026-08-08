import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createOpsSessionToken,
  isSafeOpsNextPath,
  MODERATION_OPS_COOKIE,
  verifyOpsSecret,
} from "../../../../lib/moderation/ops-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const form = await request.formData();
  const secret = String(form.get("secret") ?? "").trim();
  const next = isSafeOpsNextPath(String(form.get("next") ?? ""));
  if (!verifyOpsSecret(secret)) {
    return NextResponse.redirect(new URL(`/ops/login?error=1&next=${encodeURIComponent(next)}`, request.url), 303);
  }
  const session = createOpsSessionToken();
  (await cookies()).set(MODERATION_OPS_COOKIE, session.token, {
    httpOnly: true,
    maxAge: session.maxAge,
    path: "/",
    sameSite: "strict",
    secure: true,
  });
  return NextResponse.redirect(new URL(next, request.url), 303);
}

export async function DELETE(request: Request) {
  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(MODERATION_OPS_COOKIE, "", {
    expires: new Date(0), httpOnly: true, path: "/", sameSite: "strict", secure: true,
  });
  return response;
}
