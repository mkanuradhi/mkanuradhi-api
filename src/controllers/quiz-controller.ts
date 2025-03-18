import { NextFunction, Request, Response } from "express";
import asyncErrorHandler from "../utils/async-error-handler";
import { CreateQuizDto } from "../dtos/quiz-dto";
import * as quizService from "../services/quiz-service";
import PaginatedResult from "../interfaces/i-paginated-result";
import Quiz from "../interfaces/i-quiz";

export const createQuiz = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const courseId = req.params.courseId;
  const {
    titleEn,
    titleSi,
    duration,
    availableFrom,
    availableUntil,
  } = req.body;

  const quizDto: CreateQuizDto = {
    titleEn,
    titleSi,
    duration,
    availableFrom,
    availableUntil,
  };
  const addedQuiz = await quizService.createQuiz(courseId, quizDto);
  res.status(201).json(addedQuiz);
});

export const getQuizzes = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const courseId = req.params.courseId;
  const page = parseInt(req.query.page as string) || 0;
  const size = Math.min(parseInt(req.query.size as string) || 10, 50);

  const { items, totalCount } = await quizService.getQuizzes(courseId, page, size);
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / size) : 1;

  const result: PaginatedResult<Quiz> = {
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

export const getQuiz = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const courseId = req.params.courseId;
  const quizId = req.params.id;
  const quiz = await quizService.getQuiz(courseId, quizId);
  res.status(200).json(quiz);
});