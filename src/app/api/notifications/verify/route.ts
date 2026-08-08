import { NextResponse } from "next/server";
import { hashNotificationVerificationToken } from "../../../../lib/email/notification-verification";
import { supabaseRpc } from "../../../../lib/supabase/rest";
import { getNetworkRateLimitResponse } from "../../../../lib/abuse/network-guard";
import { ABUSE_POLICY } from "../../../../lib/abuse/policy";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export async function GET(request: Request) {
  const rateLimitResponse = await getNetworkRateLimitResponse({
    action: "notification.verify",
    budgets: ABUSE_POLICY.notificationVerify.networkBudgets,
    request,
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const url = new URL(request.url);
  const publicUuid = url.searchParams.get("post")?.trim() ?? "";
  const token = url.searchParams.get("token")?.trim() ?? "";
  let verified = false;

  if (UUID_PATTERN.test(publicUuid) && token.length >= 32 && token.length <= 128) {
    try {
      verified = Boolean(
        await supabaseRpc<boolean>("verify_post_notification_email", {
          p_public_uuid: publicUuid,
          p_token_hash: hashNotificationVerificationToken(token),
        }),
      );
    } catch (error) {
      console.error("[email] Verification failed:", error);
    }
  }

  const destination = new URL(
    UUID_PATTERN.test(publicUuid) ? `/v/${publicUuid}` : "/",
    url.origin,
  );
  destination.searchParams.set("emailVerified", verified ? "1" : "0");
  return NextResponse.redirect(destination, 303);
}
