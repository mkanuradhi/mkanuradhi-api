import type Mail from 'nodemailer/lib/mailer';

export interface SendEmailDto {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Mail.Attachment[];
}