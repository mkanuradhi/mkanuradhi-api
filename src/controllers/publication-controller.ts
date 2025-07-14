import { NextFunction, Request, Response } from "express";
import asyncErrorHandler from "../utils/async-error-handler";
import { ActivationPublicationDto, CreatePublicationDto, UpdatePublicationDto } from "../dtos/publication-dto";
import * as publicationService from "../services/publication-service";
import PaginatedResult from "../interfaces/i-paginated-result";
import Publication from "../interfaces/i-publication";


export const createPublication = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const {
    type,
    year,
    title,
    source,
    authors,
    publicationStatus,
    tags,
    keywords,
    publicationUrl,
    pdfUrl,
    doiUrl,
    preprintUrl,
    slidesUrl,
    abstract,
    bibtex,
    ris,
    publishedDate,
  } = req.body;

  const publicationDto: CreatePublicationDto = {
    type,
    year,
    title,
    source,
    authors,
    publicationStatus,
    tags,
    keywords,
    publicationUrl,
    pdfUrl,
    doiUrl,
    preprintUrl,
    slidesUrl,
    abstract,
    bibtex,
    ris,
    publishedDate,
  };
  const addedPublication = await publicationService.createPublication(publicationDto);
  res.status(201).json(addedPublication);
});

export const getPublications = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 0;
  const size = Math.min(parseInt(req.query.size as string) || 10, 200);

  const { items, totalCount } = await publicationService.getPublications(page, size);
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / size) : 1;

  const result: PaginatedResult<Publication> = {
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

export const getGroupedPublications = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const result = await publicationService.getGroupedPublications();
  res.status(200).json(result);
});

export const getPublicationById = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const publicationId = req.params.id;
  const publication = await publicationService.getPublicationById(publicationId);
  res.status(200).json(publication);
});

export const updatePublication = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const publicationId = req.params.id;

  const {
    type,
    year,
    title,
    source,
    authors,
    publicationStatus,
    tags,
    keywords,
    publicationUrl,
    pdfUrl,
    doiUrl,
    preprintUrl,
    slidesUrl,
    abstract,
    bibtex,
    ris,
    publishedDate,
    v
  } = req.body;

  const publicationDto: UpdatePublicationDto = {
    type,
    year,
    title,
    source,
    authors,
    publicationStatus,
    tags,
    keywords,
    publicationUrl,
    pdfUrl,
    doiUrl,
    preprintUrl,
    slidesUrl,
    abstract,
    bibtex,
    ris,
    publishedDate,
    v
  };
  
  const updatedPublication = await publicationService.updatePublication(publicationId, publicationDto);
  res.status(200).json(updatedPublication);
});

export const togglePublicationActivation = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const publicationId = req.params.id;
  const {
    status,
  } = req.body;

  const publicationDto: ActivationPublicationDto = {
    status,
  };
  
  const updatedPublication = await publicationService.togglePublicationActivation(publicationId, publicationDto);
  res.status(200).json(updatedPublication);
});

export const deletePublication = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const publicationId = req.params.id;
  await publicationService.deletePublication(publicationId);
  res.status(204).json();
});

export const getYearlyPublications = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const result = await publicationService.getYearlyPublications();
  res.status(200).json(result);
});

export const getYearlyPublicationsByType = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const result = await publicationService.getYearlyPublicationsByType();
  res.status(200).json(result);
});

export const getPublicationsByType = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const result = await publicationService.getPublicationsByType();
  res.status(200).json(result);
});
