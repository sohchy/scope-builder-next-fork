const MAILJET_SEND_URL = "https://api.mailjet.com/v3.1/send";

export interface MailjetRecipient {
  Email: string;
  Name?: string;
}

export interface MailjetAttachment {
  /** e.g. 'text/calendar; charset=UTF-8; method=REQUEST' */
  ContentType: string;
  Filename: string;
  Base64Content: string;
}

export interface SendEmailInput {
  to: MailjetRecipient[];
  subject: string;
  textPart: string;
  htmlPart: string;
  attachments?: MailjetAttachment[];
}

export type SendEmailResult = { ok: true } | { ok: false; error: string };

/**
 * Sends a transactional email through the Mailjet Send API v3.1.
 *
 * Never throws — callers (booking flows) must not fail because Mailjet is
 * unreachable or unconfigured. Failures are logged and returned.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.MAILJET_API_KEY;
  const apiSecret = process.env.MAILJET_API_SECRET;
  const fromEmail = process.env.MAILJET_FROM_EMAIL;
  const fromName =
    process.env.MAILJET_FROM_NAME || "NUtech Ventures Startup Jrny";

  if (!apiKey || !apiSecret || !fromEmail) {
    const error =
      "Mailjet is not configured (MAILJET_API_KEY / MAILJET_API_SECRET / MAILJET_FROM_EMAIL)";
    console.warn(`[mailjet] skipping send — ${error}`);
    return { ok: false, error };
  }

  const recipients = input.to.filter((r) => !!r.Email?.trim());
  if (recipients.length === 0) {
    const error = "No recipients with an email address";
    console.warn(`[mailjet] skipping send — ${error}`);
    return { ok: false, error };
  }

  const body = {
    Messages: [
      {
        From: { Email: fromEmail, Name: fromName },
        To: recipients,
        Subject: input.subject,
        TextPart: input.textPart,
        HTMLPart: input.htmlPart,
        ...(input.attachments?.length
          ? { Attachments: input.attachments }
          : {}),
      },
    ],
  };

  try {
    const res = await fetch(MAILJET_SEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      const error = `Mailjet responded ${res.status} ${res.statusText}${detail ? ` — ${detail}` : ""}`;
      console.error(`[mailjet] ${error}`);
      return { ok: false, error };
    }

    return { ok: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[mailjet] send failed — ${error}`);
    return { ok: false, error };
  }
}
