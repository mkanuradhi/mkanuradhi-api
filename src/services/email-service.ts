import logger from "../config/logger-config";
import nodemailer from 'nodemailer';
import { SendEmailDto } from '../dtos/email-dto';
import { EmailResult } from '../interfaces/i-email-result';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_APP_PASS,
  },
});

export const sendEmail = async (sendEmailDto: SendEmailDto): Promise<EmailResult> => {

  const mailOptions: nodemailer.SendMailOptions = {
    from: process.env.EMAIL_ADDRESS,
    to: sendEmailDto.to,
    cc: sendEmailDto.cc,
    bcc: sendEmailDto.bcc,
    subject: sendEmailDto.subject,
    html: sendEmailDto.html,
    text: sendEmailDto.text,
    attachments: sendEmailDto.attachments || [],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { ok: true, info };
  } catch (error) {
    logger.error(`Error sending email: `, error);
    return { ok: false, error };
  }
}

export const sendEmailViaResend = async (sendEmailDto: SendEmailDto): Promise<EmailResult> => {
  const { data, error } = await resend.emails.send({
    from: process.env.FROM_EMAIL_ADDRESS || '',
    to: sendEmailDto.to,
    subject: sendEmailDto.subject,
    html: sendEmailDto.html || '',
    text: sendEmailDto.text || '',
    cc: sendEmailDto.cc,
    bcc: sendEmailDto.bcc,
  });

  if (error) {
    logger.error(`Error sending email via resend: `, error);
    return { ok: false, error };
  }

  return { ok: true, info: data };
}