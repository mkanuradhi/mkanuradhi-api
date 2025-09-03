import { NextFunction, Request, Response } from "express";
import asyncErrorHandler from "../utils/async-error-handler";
import { CreateAwardEnDto } from "../dtos/award-dto";
import * as awardService from "../services/award-service";

export const createAwardEn = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const {
    titleEn,
    descriptionEn,
    issuerEn,
    issuerLocationEn,
    ceremonyLocationEn,
    coRecipientsEn,

    receivedDate,
    type,
    scope,
    role,
    result,
    category,

    eventUrl,
    relatedWorkUrl,
    monetaryValue,
  } = req.body;

  const awardEnDto: CreateAwardEnDto = {
    titleEn,
    descriptionEn,
    issuerEn,
    issuerLocationEn,
    ceremonyLocationEn,
    coRecipientsEn,

    receivedDate,
    type,
    scope,
    role,
    result,
    category,

    eventUrl,
    relatedWorkUrl,
    monetaryValue,
  };
  const addedAward = await awardService.createAwardEn(awardEnDto);
  res.status(201).json(addedAward);
});