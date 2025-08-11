import { CreateContactMessageDto } from '../dtos/contact-message-dto';
import ContactMessage, { FullContactMessage } from '../interfaces/i-contact-message';
import logger from "../config/logger-config";
import { sendEmail } from "./email-service";
import { SendEmailDto } from '../dtos/email-dto';
import { mapDocumentsToFullContactMessages, mapDocumentToContactMessage, mapDocumentToFullContactMessage } from "../mappers/contact-message-mapper";
import ContactMessageModel from "../models/contact-message-model";
import AppError from '../errors/app-error';
import { verifyRecaptcha } from './recaptcha-service';
import { fetchIpInfo } from './ipapi-service';
import { ParsedUserAgent } from '../interfaces/i-parsed-user-agent';
import { UAParser } from 'ua-parser-js';
import { validatePaginationDetails } from '../validators/common-validator';

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
      isRead: false,
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

export const getFullContactMessages = async (page: number, size: number): Promise<{ items: FullContactMessage[], totalCount: number }> => {
  validatePaginationDetails(page, size);
  const totalCount = await ContactMessageModel.countDocuments({ deleted: false });
  const contactMessageDocs = await ContactMessageModel
    .find(
      {
        deleted: false,
      }, 
      {
        name: 1,
        email: 1,
        message: 1,
        userAgent: 1,
        screen: 1,
        timezone: 1,
        language: 1,
        ipAddress: 1,
        city: 1,
        country: 1,
        latitude: 1,
        longitude: 1,
        browser: 1,
        os: 1,
        deviceType: 1,
        isRead: 1,
        status: 1,
        createdAt: 1,
      })
    .sort({ createdAt: -1 })
    .skip(page * size)
    .limit(size);

  return {
    items: mapDocumentsToFullContactMessages(contactMessageDocs),
    totalCount
  };
}

export const toggleIsReadInContactMessage = async (contactMessageId: string): Promise<FullContactMessage> => {
  const contactMessageDoc = await ContactMessageModel.findOne({
    _id: contactMessageId,
    deleted: false,
  });
  if (!contactMessageDoc) {
      throw new AppError(`Cannot find the contact message with ID: ${contactMessageId}. Unable to toggle the contact message.`, 400);
  }

  const updatedContactMessageDoc = await ContactMessageModel.findByIdAndUpdate(
    contactMessageId,
    { 
      $set: {
        isRead: !contactMessageDoc.isRead,
      },
      $inc: { __v: 1 }
    },
    { new: true, runValidators: true }
  );

  if (!updatedContactMessageDoc) {
      throw new AppError('Failed to update contact message document.', 500);
  }

  logger.info(`Contact message toggled for ID: ${contactMessageId}`);
  return mapDocumentToFullContactMessage(updatedContactMessageDoc);
}

export const deleteContactMessage = async (contactMessageId: string): Promise<void> => {
  const contactMessageDoc = await ContactMessageModel.findOne({ 
    _id: contactMessageId,
    deleted: false,
  });
  if (!contactMessageDoc) {
    throw new AppError(`Cannot find the contact message with ID '${contactMessageId}' or it is already deleted.`, 404);
  }

  const updatedContactMessageDoc = await ContactMessageModel.findByIdAndUpdate(
    contactMessageId,
    {
      $set: {
        deleted: true,
      },
      $inc: { __v: 1 }
    },
    { new: true }
  );
  if (!updatedContactMessageDoc) {
    throw new AppError('Failed to delete contact message document.', 500);
  }

  logger.info(`Contact message deleted for id: ${contactMessageId}`);
}
