import { CreateContactMessageDto } from '../dtos/contact-message-dto';
import ContactMessage, { FullContactMessage } from '../interfaces/i-contact-message';
import logger from "../config/logger-config";
import { sendEmail, sendEmailViaResend } from "./email-service";
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
    sendAcknowledgeEmailToSender(contactMessageDto);

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

const sendAcknowledgeEmailToSender = async (contactMessageDto: CreateContactMessageDto): Promise<void> => {
  const htmlMessage = getAcknowledgmentEmailHtml(contactMessageDto.name);

  const sendEmailDto: SendEmailDto = {
    to: contactMessageDto.email || '',
    subject: `Contact form submission from ${contactMessageDto.name}`,
    html: htmlMessage,
  };

  // send the email asynchronously
  sendEmailViaResend(sendEmailDto)
    .then(r => logger.info(`Email worker ok: ${r.ok}`))
    .catch(err => logger.error('Async email error', err));
}

const getAcknowledgmentEmailHtml = (name: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
  <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
    <tr>
      <td style="padding: 50px 40px; text-align: center;">
        <div style="width: 80px; height: 80px; margin: 0 auto 30px; background-color: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          <span style="color: white; font-size: 40px;">✓</span>
        </div>
        
        <h1 style="margin: 0 0 20px; color: #1f2937; font-size: 28px; font-weight: 700;">Message Received!</h1>
        
        <p style="margin: 0 0 30px; color: #6b7280; font-size: 16px; line-height: 1.6;">
          Hi ${name}, thanks for getting in touch! I've received your message and I'll respond as soon as possible.
        </p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">
            <strong>What happens next?</strong><br>
            I typically respond within 72 hours during business days. I'm looking forward to helping you!
          </p>
        </div>
        
        <p style="margin: 0; color: #6b7280; font-size: 14px;">
          Best wishes,<br>
          <strong style="color: #1f2937;">The Team</strong>
        </p>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 30px 40px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
          This is an automated confirmation. Please do not reply.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

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

export const getUnreadContactMessagesCount = async (): Promise<{ count: number }> => {
  const unreadCount = await ContactMessageModel.countDocuments({ deleted: false, isRead: false });
  return { count: unreadCount };
}
