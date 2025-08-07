import { NextFunction, Request, Response } from "express";
import logger from "../config/logger-config";
import asyncErrorHandler from "../utils/async-error-handler";
import * as contactService from '../services/contact-service';
import { CreateContactMessageDto } from "../dtos/contact-message-dto";

export const createContactMessage = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  try {
      logger.info(`Creating contact message...`);

      const { name,
        email,
        message,
        captchaToken,
        userAgent,
        screen,
        timezone,
        language
      } = req.body;

      const ipAddress = req.ip;

      const contactMessageDto: CreateContactMessageDto = {
          name,
          email,
          message,
          captchaToken,
          userAgent,
          screen,
          timezone,
          language,
          ipAddress,
        };
      const addedContactMessage = await contactService.createContactMessage(contactMessageDto);
      res.status(200).json(addedContactMessage);
  } catch (err) {
      next(err);
  }
});
