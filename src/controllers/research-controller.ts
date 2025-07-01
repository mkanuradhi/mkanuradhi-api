import { NextFunction, Request, Response } from "express";
import asyncErrorHandler from "../utils/async-error-handler";
import { CreateResearchDto } from "../dtos/research-dto";
import * as researchService from "../services/research-service";
import Research from "../interfaces/i-research";
import PaginatedResult from "../interfaces/i-paginated-result";

export const createResearch = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const {
    type,
    degree,
    completedYear,
    title,
    location,
    abstract,
    supervisors,
    keywords,
    thesisUrl,
    githubUrl,
    slidesUrl,
    studentName,
    supervisionStatus,
    registrationNumber,
    startedDate,
    completedDate,
    isMine,
  } = req.body;

  const researchDto: CreateResearchDto = {
    type,
    degree,
    completedYear,
    title,
    location,
    abstract,
    supervisors,
    keywords,
    thesisUrl,
    githubUrl,
    slidesUrl,
    studentName,
    supervisionStatus,
    registrationNumber,
    startedDate,
    completedDate,
    isMine,
  };
  const addedResearch = await researchService.createResearch(researchDto);
  res.status(201).json(addedResearch);
});

export const getResearches = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 0;
  const size = Math.min(parseInt(req.query.size as string) || 10, 200);

  const { items, totalCount } = await researchService.getResearches(page, size);
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / size) : 1;

  const result: PaginatedResult<Research> = {
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

export const getResearchById = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const researchId = req.params.id;
  const research = await researchService.getResearchById(researchId);
  res.status(200).json(research);
});
