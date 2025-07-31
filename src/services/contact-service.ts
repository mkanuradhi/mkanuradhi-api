import { CreateContactMessageDto } from '../dtos/contact-message-dto';
import logger from "../config/logger-config";
import { sendEmail } from "./email-service";
import { SendEmailDto } from '../dtos/email-dto';

export const createContactMessage = async (contactMessage: CreateContactMessageDto): Promise<Object> => {

  const htmlMessage = `
    <h2>You have received a new message from your website contact form.</h2>
    <p><b>Name:</b> ${contactMessage.name}</p>
    <p><b>Email:</b> ${contactMessage.email}</p>
    <p><b>Message:</b></p>
    <p>${contactMessage.message}</p>
  `;

  const sendEmailDto: SendEmailDto = {
    to: process.env.EMAIL_NOTIFY || '',
    subject: `New contact message from ${contactMessage.name}`,
    html: htmlMessage,
  };

  // send the email asynchronously
  sendEmail(sendEmailDto)
    .then(r => logger.info(`Email worker ok: ${r.ok}`))
    .catch(err => logger.error('Async email error', err));
  
  return {"msg": "success"};
}