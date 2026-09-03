const RESEND_SEND_URL = "https://api.resend.com/emails";

/** Resend rejects the whole request past this, so we truncate rather than lose the send. */
const MAX_RECIPIENTS = 50;

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  /** e.g. 'text/calendar; charset=UTF-8; method=REQUEST' */
  content_type: string;
  filename: string;
  /** Base64-encoded file content. */
  content: string;
}

export interface SendEmailInput {
  to: EmailRecipient[];
  subject: string;
  text: string;
  html: string;
  attachments?: EmailAttachment[];
}

export type SendEmailResult = { ok: true } | { ok: false; error: string };

/**
 * Display names reach us from Clerk, so they can contain anything. An unquoted
 * comma would split one recipient into two malformed addresses, so quote the
 * name whenever it holds a character with meaning in an address list.
 */
function formatAddress({ email, name }: EmailRecipient): string {
  const trimmed = name?.trim();
  if (!trimmed) return email;
  const quoted = /["<>,;:@\\]/.test(trimmed)
    ? `"${trimmed.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
    : trimmed;
  return `${quoted} <${email}>`;
}

/**
 * Sends a transactional email through the Resend API.
 *
 * Never throws — callers (booking flows) must not fail because Resend is
 * unreachable or unconfigured. Failures are logged and returned.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM_ADDRESS;
  const fromName =
    process.env.EMAIL_FROM_NAME || "NUtech Ventures Startup Jrny";

  if (!apiKey || !fromEmail) {
    const error =
      "Resend is not configured (RESEND_API_KEY / EMAIL_FROM_ADDRESS)";
    console.warn(`[email] skipping send — ${error}`);
    return { ok: false, error };
  }

  const recipients = input.to.filter((r) => !!r.email?.trim());
  if (recipients.length === 0) {
    const error = "No recipients with an email address";
    console.warn(`[email] skipping send — ${error}`);
    return { ok: false, error };
  }

  if (recipients.length > MAX_RECIPIENTS) {
    console.warn(
      `[email] "${input.subject}" has ${recipients.length} recipients — sending to the first ${MAX_RECIPIENTS}`,
    );
    recipients.length = MAX_RECIPIENTS;
  }

  const body = {
    from: formatAddress({ email: fromEmail, name: fromName }),
    to: recipients.map(formatAddress),
    subject: input.subject,
    text: input.text,
    html: input.html,
    ...(input.attachments?.length ? { attachments: input.attachments } : {}),
  };

  try {
    const res = await fetch(RESEND_SEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      const error = `Resend responded ${res.status} ${res.statusText}${detail ? ` — ${detail}` : ""}`;
      console.error(`[email] ${error}`);
      return { ok: false, error };
    }

    // The id is the only handle for tracing a send in the Resend dashboard.
    const id = await res
      .json()
      .then((json: { id?: string }) => json?.id)
      .catch(() => undefined);
    console.log(`[email] sent "${input.subject}" — ${id ?? "no id returned"}`);

    return { ok: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[email] send failed — ${error}`);
    return { ok: false, error };
  }
}
