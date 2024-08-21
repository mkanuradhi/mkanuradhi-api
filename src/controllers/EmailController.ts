import { NextFunction, Request, Response } from "express";
import logger from "../config/Logger";
import * as emailService from '../services/EmailService';

const notifyMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
      logger.info(`Notifying message...`);
      const { name, email, message } = req.body;
      const emailResp = await emailService.notifyMessage(name, email, message);
      res.status(200).json(emailResp);
  } catch (err) {
      next(err);
  }
}

export { notifyMessage };
