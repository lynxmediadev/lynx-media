export type AuthEmailKind = "invite" | "password_reset" | "verify_email";

export type AuthEmailPayload = {
  kind: AuthEmailKind;
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type EmailSendResult = {
  provider: string;
  messageId?: string;
};

export interface EmailProvider {
  readonly id: string;
  send(payload: AuthEmailPayload): Promise<EmailSendResult>;
}

