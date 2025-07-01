import { NextFunction, Request, Response } from "express";
import asyncErrorHandler from "../utils/async-error-handler";
import { CreateResearchDto } from "../dtos/research-dto";
import * as researchService from "../services/research-service";

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