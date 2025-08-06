import { CreateContactMessageDto } from '../dtos/contact-message-dto';
import ContactMessage from '../interfaces/i-contact-message';
import logger from "../config/logger-config";
import { sendEmail } from "./email-service";
import { SendEmailDto } from '../dtos/email-dto';
import { mapDocumentToContactMessage } from "../mappers/contact-message-mapper";
import ContactMessageModel from "../models/contact-message-model";
import AppError from '../errors/app-error';
import { verifyRecaptcha } from './recaptcha-service';
import { fetchIpInfo } from './ipapi-service';
import { ParsedUserAgent } from '../interfaces/i-parsed-user-agent';
import { UAParser } from 'ua-parser-js';

export const createContactMessage = async (contactMessageDto: CreateContactMessageDto): Promise<ContactMessage> => {
  await verifyRecaptcha(contactMessageDto.captchaToken);

  validateContactMessage(contactMessageDto);

  const ipApiResponse = await fetchIpInfo(contactMessageDto.ipAddress || '');
  const parsedUserAgent = parseUserAgent(contactMessageDto.userAgent || '');

  const session = await ContactMessageModel.startSession();

  try {
    session.startTransaction();

    const [contactMessageDoc] = await ContactMessageModel.create([{
      name: contactMessageDto.name,
      email: contactMessageDto.email,
      message: contactMessageDto.message,
      userAgent: contactMessageDto.userAgent,
      screen: contactMessageDto.screen,
      timezone: contactMessageDto.timezone,
      language: contactMessageDto.language,
      ipAddress: contactMessageDto.ipAddress,
      city: ipApiResponse.city,
      country: ipApiResponse.countryName,
      latitude: ipApiResponse.latitude,
      longitude: ipApiResponse.longitude,
      browser: parsedUserAgent.browser,
      os: parsedUserAgent.os,
      deviceType: parsedUserAgent.deviceType,
    }], { session });

    await session.commitTransaction();

    logger.info(`Contact Message created for ${contactMessageDto.name}`);

    sendNotifyEmail(contactMessageDto);

    return mapDocumentToContactMessage(contactMessageDoc);
  } catch (error) {
    await session.abortTransaction();
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(`Contact message creation failed: ${error.message}`, 500);
    } else {
      throw new AppError("Contact message creation failed", 500);
    }
  } finally {
    session.endSession();
  }
}

const validateContactMessage = (contactMessageDto: CreateContactMessageDto): void => {
  if (!contactMessageDto.name || !contactMessageDto.email || !contactMessageDto.message) {
    throw new AppError(`Name, email, and message are required fields.`, 400);
  }
  if (contactMessageDto.name.length < 2 || !/^[a-zA-Z\s]+$/.test(contactMessageDto.name)) {
    throw new AppError(`Name must be valid`, 400);
  }
  if (contactMessageDto.name.length > 30) {
    throw new AppError(`Name is too long`, 400);
  }
  if (contactMessageDto.email.length < 4 || !contactMessageDto.email.includes('@')) {
    throw new AppError(`Email must be valid`, 400);
  }
  if (contactMessageDto.email.length > 50) {
    throw new AppError(`Email is too long`, 400);
  }
  if (contactMessageDto.message.length < 6) {
    throw new AppError(`Message must be valid`, 400);
  }
  if (contactMessageDto.message.length > 400) {
    throw new AppError(`Message is too long`, 400);
  }
}

const sendNotifyEmail = async (contactMessageDto: CreateContactMessageDto): Promise<void> => {
  const htmlMessage = `
    <h2>You have received a new message from your website contact form.</h2>
    <p><b>Name:</b> ${contactMessageDto.name}</p>
    <p><b>Email:</b> ${contactMessageDto.email}</p>
    <p><b>Message:</b></p>
    <p>${contactMessageDto.message}</p>
  `;

  const sendEmailDto: SendEmailDto = {
    to: process.env.EMAIL_NOTIFY || '',
    subject: `Contact form submission from ${contactMessageDto.name}`,
    html: htmlMessage,
  };

  // send the email asynchronously
  sendEmail(sendEmailDto)
    .then(r => logger.info(`Email worker ok: ${r.ok}`))
    .catch(err => logger.error('Async email error', err));
}

const parseUserAgent = (userAgent: string): ParsedUserAgent => {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  return {
    browser: result.browser.name || 'Unknown',
    browserVersion: result.browser.version || 'Unknown',
    os: result.os.name || 'Unknown',
    osVersion: result.os.version || 'Unknown',
    deviceType: result.device.type || null,
    deviceVendor: result.device.vendor || null,
    deviceModel: result.device.model || null,
    isBot: !!result.device.type,
  };
}