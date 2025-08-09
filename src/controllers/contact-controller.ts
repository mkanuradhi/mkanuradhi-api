import { NextFunction, Request, Response } from "express";
import logger from "../config/logger-config";
import asyncErrorHandler from "../utils/async-error-handler";
import * as contactService from '../services/contact-service';
import { CreateContactMessageDto } from "../dtos/contact-message-dto";
import PaginatedResult from "../interfaces/i-paginated-result";
import { FullContactMessage } from "../interfaces/i-contact-message";

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

export const getFullContactMessages = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 0;
  const size = Math.min(parseInt(req.query.size as string) || 10, 200);

  const { items, totalCount } = await contactService.getFullContactMessages(page, size);
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / size) : 1;

  const result: PaginatedResult<FullContactMessage> = {
    items,
    pagination: {
      totalCount,
      totalPages,
      currentPage: page,
      currentPageSize: items.length,
    },
  };

  res.status(200).json(result);
});
