import "server-only";
import type { AuthEmailPayload, EmailProvider, EmailSendResult } from "@/lib/account-auth/email/types";

function redactSensitiveTokens(input: string) {
  return input
    .replace(/([?&]token=)[^&\s]+/gi, "$1[redacted]")
    .replace(/(token=)[A-Za-z0-9._~-]+/gi, "$1[redacted]");
}

export class ConsoleEmailProvider implements EmailProvider {
  readonly id = "console";

  async send(payload: AuthEmailPayload): Promise<EmailSendResult> {
    const now = new Date().toISOString();
    const messageId = `console-${payload.kind}-${Date.now()}`;

    console.info("[auth:email:console]", {
      ts: now,
      kind: payload.kind,
      to: payload.to,
      subject: payload.subject,
      messageId,
      previewText: redactSensitiveTokens(payload.text).slice(0, 240),
    });

    return { provider: this.id, messageId };
  }
}
