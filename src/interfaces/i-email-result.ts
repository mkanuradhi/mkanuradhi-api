import { SentMessageInfo } from 'nodemailer';

export interface EmailResult {
  ok: boolean;
  info?: SentMessageInfo;
  error?: unknown;
}
