import { NextFunction, Request, Response } from "express";
import asyncErrorHandler from "../utils/async-error-handler";
import * as mediaContributionService from "../services/media-contribution-service";
import { parseLangQueryParam } from "../utils/common-util";
import PaginatedResult from "../interfaces/i-paginated-result";
import MediaContribution, { LocalizedSummaryMediaContribution } from "../interfaces/i-media-contribution";

export const getMediaContributions = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 0;
  const size = Math.min(parseInt(req.query.size as string) || 10, 200);

  const { items, totalCount } = await mediaContributionService.getMediaContributions(page, size);
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / size) : 1;

  const result: PaginatedResult<MediaContribution> = {
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

export const getMediaContribution = asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
  const mediaContributionId = req.params.id;
  const mediaContribution = await mediaContributionService.getMediaContribution(mediaContributionId);
  res.status(200).json(mediaContribution);
});

export const createMediaContribution = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const addedMediaContribution = await mediaContributionService.createMediaContribution(req.body, req.appUser);
  res.status(201).json(addedMediaContribution);
});

export const deleteMediaContribution = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const mediaContributionId = req.params.id;
  await mediaContributionService.deleteMediaContribution(mediaContributionId, req.appUser);
  res.status(204).json();
});

export const getLocalizedMediaContributions = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const lang: string = parseLangQueryParam(req);
  const page = parseInt(req.query.page as string) || 0;
  const size = Math.min(parseInt(req.query.size as string) || 10, 200);

  const { items, totalCount } = await mediaContributionService.getLocalizedMediaContributions(lang, page, size);
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / size) : 1;

  const result: PaginatedResult<LocalizedSummaryMediaContribution> = {
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

export const getLocalizedMediaContributionByPath = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const lang: string = parseLangQueryParam(req);
  const bookPath = req.params.path;
  const mediaContribution = await mediaContributionService.getLocalizedMediaContributionByPath(lang, bookPath);
  res.status(200).json(mediaContribution);
});
