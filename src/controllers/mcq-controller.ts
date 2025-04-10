import { NextFunction, Request, Response } from "express";
import asyncErrorHandler from "../utils/async-error-handler";
import { ActivationMcqDto, CreateMcqDto, UpdateMcqDto } from "../dtos/mcq-dto";
import * as mcqService from "../services/mcq-service";
import PaginatedResult from "../interfaces/i-paginated-result";
import Mcq from "../interfaces/i-mcq";

export const createMcq = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const quizId = req.params.quizId;
  const {
    question,
    choices,
    isMultiSelect,
    solutionExplanation,
  } = req.body;

  const mcqDto: CreateMcqDto = {
    question,
    choices,
    isMultiSelect,
    solutionExplanation,
  };
  const addedQuiz = await mcqService.createMcq(quizId, mcqDto);
  res.status(201).json(addedQuiz);
});

export const getMcqs = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const quizId = req.params.quizId;
  const page = parseInt(req.query.page as string) || 0;
  const size = Math.min(parseInt(req.query.size as string) || 50, 100);

  const { items, totalCount } = await mcqService.getMcqs(quizId, page, size);
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / size) : 1;

  const result: PaginatedResult<Mcq> = {
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

export const getMcq = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const quizId = req.params.quizId;
  const mcqId = req.params.id;
  const mcq = await mcqService.getMcq(quizId, mcqId);
  res.status(200).json(mcq);
});

export const updateMcq = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const quizId = req.params.quizId;
  const mcqId = req.params.id;

  const {
    question,
    choices,
    isMultiSelect,
    solutionExplanation,
    v
  } = req.body;

  const mcqDto: UpdateMcqDto = {
    question,
    choices,
    isMultiSelect,
    solutionExplanation,
    v
  };
  
  const updatedMcq = await mcqService.updateMcq(quizId, mcqId, mcqDto);
  res.status(200).json(updatedMcq);
});

export const toggleMcqActivation = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const quizId = req.params.quizId;
  const mcqId = req.params.id;
  const {
    status,
  } = req.body;

  const mcqDto: ActivationMcqDto = {
    status,
  };
  
  const updatedMcq = await mcqService.toggleMcqActivation(quizId, mcqId, mcqDto);
  res.status(200).json(updatedMcq);
});

export const deleteMcq = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const quizId = req.params.quizId;
  const mcqId = req.params.id;
  await mcqService.deleteMcq(quizId, mcqId);
  res.status(204).json();
});
