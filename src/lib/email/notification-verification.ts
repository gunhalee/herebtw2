import { createHash, randomBytes } from "node:crypto";
import { Resend } from "resend";
import { escapeHtml } from "./validation";

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const FROM_EMAIL = "여기 근데 <onboarding@resend.dev>";

export function createNotificationVerification() {
  const token = randomBytes(32).toString("base64url");

  return {
    expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS).toISOString(),
    token,
    tokenHash: createHash("sha256").update(token, "utf8").digest("hex"),
  };
}

export function hashNotificationVerificationToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export async function sendNotificationVerification(input: {
  applicationOrigin: string;
  publicUuid: string;
  toEmail: string;
  token: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return { sent: false };
  }

  const verificationUrl = new URL("/api/notifications/verify", input.applicationOrigin);
  verificationUrl.searchParams.set("post", input.publicUuid);
  verificationUrl.searchParams.set("token", input.token);
  const safeUrl = escapeHtml(verificationUrl.toString());

  try {
    await new Resend(apiKey).emails.send({
      from: FROM_EMAIL,
      to: input.toEmail,
      subject: "답변 알림 이메일을 확인해 주세요",
      html: `
        <div style="font-family: -apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; max-width: 520px; margin: 0 auto; padding: 28px 16px;">
          <h1 style="font-size: 20px; color: #111827;">답변 알림을 받을 이메일이 맞나요?</h1>
          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">아래 버튼을 누른 경우에만 후보자 답변 알림을 보내드립니다. 요청한 적이 없다면 이 메일을 무시해 주세요.</p>
          <a href="${safeUrl}" style="display: inline-block; background: #111827; color: #ffffff; padding: 12px 20px; border-radius: 999px; text-decoration: none; font-weight: 700;">이메일 확인하기</a>
        </div>
      `,
    });
    return { sent: true };
  } catch (error) {
    console.error("[email] Failed to send verification email:", error);
    return { sent: false };
  }
}
