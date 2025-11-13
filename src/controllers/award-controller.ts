import { NextFunction, Request, Response } from "express";
import asyncErrorHandler from "../utils/async-error-handler";
import { ActivationAwardDto, CreateAwardEnDto, UpdateAwardEnDto, UpdateAwardSiDto } from "../dtos/award-dto";
import * as awardService from "../services/award-service";
import PaginatedResult from "../interfaces/i-paginated-result";
import Award from "../interfaces/i-award";
import { SearchParamsDto } from "../dtos/search-params-dto";
import { parseLangQueryParam, parseSearchParams } from "../utils/common-util";
import AwardView from "../interfaces/i-award-view";

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
  const addedAward = await awardService.createAwardEn(awardEnDto, req.appUser);
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
  
  const updatedAward = await awardService.updateAwardEn(awardId, awardDto, req.appUser);
  res.status(200).json(updatedAward);
});

export const updateAwardSi = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const awardId = req.params.id;
  const {
    titleSi,
    descriptionSi,
    issuerSi,
    issuerLocationSi,
    ceremonyLocationSi,
    coRecipientsSi,
    v
  } = req.body;

  const awardDto: UpdateAwardSiDto = {
    titleSi,
    descriptionSi,
    issuerSi,
    issuerLocationSi,
    ceremonyLocationSi,
    coRecipientsSi,
    v
  };
  
  const updatedAward = await awardService.updateAwardSi(awardId, awardDto, req.appUser);
  res.status(200).json(updatedAward);
});

export const toggleAwardActivation = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const awardId = req.params.id;
  const {
    status,
  } = req.body;

  const awardDto: ActivationAwardDto = {
    status,
  };
  
  const updatedAward = await awardService.toggleAwardActivation(awardId, awardDto, req.appUser);
  res.status(200).json(updatedAward);
});

export const uploadPrimaryImage = asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
  const awardId = req.params.id;
  const updatedAward = await awardService.uploadPrimaryImage(awardId, req.file);
  res.status(200).json(updatedAward);
});

export const deleteAward = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const awardId = req.params.id;
  await awardService.deleteAward(awardId, req.appUser);
  res.status(204).json();
});

export const searchAwards = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const searchParams: SearchParamsDto = parseSearchParams(req);
  const lang: string = parseLangQueryParam(req);
  const { awardViews, totalCount } = await awardService.searchAwards(lang, searchParams);
  
  const page = searchParams.page || 0;
  const size = searchParams.size || 200;

  const message = `${totalCount} result${totalCount !== 1 ? 's' : ''} found for '${searchParams.query}'`;
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / size) : 1;

  const result: PaginatedResult<AwardView> = {
    message,
    items: awardViews,
    pagination: {
      totalCount,
      totalPages,
      currentPage: page,
      currentPageSize: awardViews.length,
    },
  };

  res.status(200).json(result);
});
