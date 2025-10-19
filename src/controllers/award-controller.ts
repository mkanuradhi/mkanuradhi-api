import { NextFunction, Request, Response } from "express";
import asyncErrorHandler from "../utils/async-error-handler";
import { CreateAwardEnDto, UpdateAwardEnDto } from "../dtos/award-dto";
import * as awardService from "../services/award-service";
import PaginatedResult from "../interfaces/i-paginated-result";
import Award from "../interfaces/i-award";

export const createAwardEn = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const {
    titleEn,
    descriptionEn,
    issuerEn,
    issuerLocationEn,
    ceremonyLocationEn,
    coRecipientsEn,

    year,
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

    year,
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

export const getAwards = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 0;
  const size = Math.min(parseInt(req.query.size as string) || 10, 200);

  const { items, totalCount } = await awardService.getAwards(page, size);
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / size) : 1;

  const result: PaginatedResult<Award> = {
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

export const getAward = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const awardId = req.params.id;
  const award = await awardService.getAward(awardId);
  res.status(200).json(award);
});

export const updateAwardEn = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const awardId = req.params.id;
  const {
    titleEn,
    descriptionEn,
    issuerEn,
    issuerLocationEn,
    ceremonyLocationEn,
    coRecipientsEn,

    year,
    receivedDate,
    type,
    scope,
    role,
    result,
    category,

    eventUrl,
    relatedWorkUrl,
    monetaryValue,
    v
  } = req.body;

  const awardDto: UpdateAwardEnDto = {
    titleEn,
    descriptionEn,
    issuerEn,
    issuerLocationEn,
    ceremonyLocationEn,
    coRecipientsEn,

    year,
    receivedDate,
    type,
    scope,
    role,
    result,
    category,

    eventUrl,
    relatedWorkUrl,
    monetaryValue,
    v
  };
  
  const updatedAward = await awardService.updateAwardEn(awardId, awardDto);
  res.status(200).json(updatedAward);
});
