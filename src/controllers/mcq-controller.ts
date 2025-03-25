import { NextFunction, Request, Response } from "express";
import asyncErrorHandler from "../utils/async-error-handler";
import { CreateMcqDto } from "../dtos/mcq-dto";
import * as mcqService from "../services/mcq-service";

export const createMcq = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const quizId = req.params.quizId;
  const {
    question,
    choices,
    solutionExplanation,
  } = req.body;

  const mcqDto: CreateMcqDto = {
    question,
    choices,
    solutionExplanation,
  };
  const addedQuiz = await mcqService.createMcq(quizId, mcqDto);
  res.status(201).json(addedQuiz);
});