import { NextFunction, Request, Response } from "express";
import asyncErrorHandler from "../utils/async-error-handler";
import { CreatePublicationDto } from "../dtos/publication-dto";
import * as publicationService from "../services/publication-service";


export const createPublication = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const {
    type,
    year,
    description,
    url,
    venue,
    bibtex,
  } = req.body;

  const publicationDto: CreatePublicationDto = {
    type,
    year,
    description,
    url,
    venue,
    bibtex,
  };
  const addedPublication = await publicationService.createPublication(publicationDto);
  res.status(201).json(addedPublication);
});