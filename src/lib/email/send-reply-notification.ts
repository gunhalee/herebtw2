import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = "여기 근데 한마디 할게요 <onboarding@resend.dev>";

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

  const voiceUrl = `https://herebtw2.vercel.app/v/${input.publicUuid}`;
  const cardImageUrl = `https://herebtw2.vercel.app/api/card/${input.publicUuid}?type=voter`;
  const cardDownloadUrl = `${cardImageUrl}&download=1`;
  const cardFileName = `voice-${input.publicUuid}.png`;
  const previewText =
    input.postContent.length > 50
      ? input.postContent.slice(0, 50) + "..."
      : input.postContent;

  try {
    let cardInlineSrc = cardImageUrl;
    let cardAttachment:
      | {
          filename: string;
          content: Buffer;
          contentType: string;
          contentId: string;
        }
      | undefined;

    try {
      const cardResponse = await fetch(cardImageUrl);

      if (cardResponse.ok) {
        const cardBuffer = Buffer.from(await cardResponse.arrayBuffer());

        if (cardBuffer.byteLength > 0) {
          cardAttachment = {
            filename: cardFileName,
            content: cardBuffer,
            contentType: "image/png",
            contentId: "reply-card-image",
          };
          cardInlineSrc = "cid:reply-card-image";
        }
      } else {
        console.warn(
          `[email] Failed to fetch card image for attachment: ${cardResponse.status}`,
        );
      }
    } catch (cardError) {
      console.warn("[email] Failed to prepare card attachment:", cardError);
    }

    await resend.emails.send({
      from: FROM_EMAIL,
      to: input.toEmail,
      subject: "당신의 목소리에 후보자가 답했습니다!",
      attachments: cardAttachment ? [cardAttachment] : undefined,
      html: `
        <div style="font-family: -apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; max-width: 520px; margin: 0 auto; padding: 28px 16px;">
          <h1 style="font-size: 20px; color: #111827; margin: 0 0 8px;">
            당신의 목소리에 ${input.candidateName} 후보가 답했습니다!
          </h1>
          <p style="font-size: 14px; color: #6b7280; margin: 0 0 24px; line-height: 1.5;">
            소중한 의견 감사합니다. 항상 민의를 중심 삼는 정치인이 되겠습니다.
          </p>

          <div style="background: #f7f4ec; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <p style="font-size: 14px; color: #374151; margin: 0; line-height: 1.6;">
              "${previewText}"
            </p>
          </div>

          <div style="text-align: center; margin: 0 0 24px;">
            <img
              src="${cardInlineSrc}"
              alt="답변이 반영된 포토카드"
              width="320"
              style="display: block; width: 100%; max-width: 320px; height: auto; margin: 0 auto 14px; border-radius: 14px; border: 1px solid #e5e7eb;"
            />
            <a href="${cardDownloadUrl}" style="display: block; width: 100%; max-width: 240px; margin: 0 auto; background: #111827; color: #ffffff; text-align: center; padding: 12px 22px; border-radius: 999px; text-decoration: none; font-size: 14px; font-weight: 700; line-height: 1.3; box-sizing: border-box;">
              포토카드 다운로드
            </a>
          </div>

          <p style="text-align: center; font-size: 11px; color: #9ca3af; margin-top: 0; line-height: 1.5;">
            수집된 이메일 주소는 답변 알림 용도로만 사용되며, 다른 목적으로 활용하지 않습니다.
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
