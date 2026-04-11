import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = "여기 근데 <noreply@herebtw.vercel.app>";

function getResendClient() {
  if (!RESEND_API_KEY) {
    return null;
  }

  return new Resend(RESEND_API_KEY);
}

type SendReplyNotificationInput = {
  toEmail: string;
  postContent: string;
  publicUuid: string;
  candidateName: string;
};

export async function sendReplyNotification(
  input: SendReplyNotificationInput,
): Promise<{ sent: boolean }> {
  const resend = getResendClient();

  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured, skipping notification");
    return { sent: false };
  }

  const voiceUrl = `https://herebtw.vercel.app/v/${input.publicUuid}`;
  const previewText =
    input.postContent.length > 50
      ? input.postContent.slice(0, 50) + "..."
      : input.postContent;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: input.toEmail,
      subject: "당신의 목소리에 답변이 달렸습니다",
      html: `
        <div style="font-family: -apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <h1 style="font-size: 20px; color: #111827; margin: 0 0 8px;">
            당신의 목소리에 답변이 달렸습니다
          </h1>
          <p style="font-size: 14px; color: #6b7280; margin: 0 0 24px; line-height: 1.5;">
            ${input.candidateName} 후보가 당신의 글에 답변했습니다.
          </p>

          <div style="background: #f7f4ec; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <p style="font-size: 14px; color: #374151; margin: 0; line-height: 1.6;">
              "${previewText}"
            </p>
          </div>

          <a href="${voiceUrl}" style="display: block; background: #2563eb; color: #ffffff; text-align: center; padding: 14px 24px; border-radius: 10px; text-decoration: none; font-size: 15px; font-weight: 700;">
            답변 확인하기
          </a>

          <p style="font-size: 11px; color: #9ca3af; margin-top: 32px; line-height: 1.5;">
            이 이메일은 '여기 근데 한마디 할게요' 서비스에서 글 작성 시 입력하신 이메일로 발송되었습니다.
            이메일은 답변 알림 용도로만 사용되며, 다른 목적으로 활용하지 않습니다.
          </p>
        </div>
      `,
    });

    return { sent: true };
  } catch (error) {
    console.error("[email] Failed to send reply notification:", error);
    return { sent: false };
  }
}
