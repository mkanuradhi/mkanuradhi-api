import logger from "../config/logger-config";
import Publication from "../interfaces/i-publication";
import { CreatePublicationDto } from "../dtos/publication-dto";
import PublicationModel from "../models/publication-model";
import AppError from "../errors/app-error";
import { mapDocumentsToPublications, mapDocumentToPublication } from "../mappers/publication-mapper";
import { validatePaginationDetails } from "../validators/common-validator";
import DocumentStatus from "../enums/document-status";


export const createPublication = async (publicationDto: CreatePublicationDto): Promise<Publication> => {
  const session = await PublicationModel.startSession();

  try {
    session.startTransaction();
    
    const existingPublicationDoc = await PublicationModel.findOne({
      year: publicationDto.year,
      description: publicationDto.description.trim(),
      deleted: false
    }).session(session);

    if (existingPublicationDoc) {
      throw new AppError(`Existing publication found for the description: ${publicationDto.description}`, 400);
    }

    const [publicationDoc] = await PublicationModel.create([{
      type: publicationDto.type,
      year: publicationDto.year,
      description: publicationDto.description,
      url: publicationDto.url,
      venue: publicationDto.venue,
      bibtex: publicationDto.bibtex,
    }], { session });

    await session.commitTransaction();

    logger.info(`Publication created for ${publicationDto.year}`);
    return mapDocumentToPublication(publicationDoc);
  } catch (error) {
    await session.abortTransaction();
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(`Publication creation failed: ${error.message}`, 500);
    } else {
      throw new AppError("Publication creation failed", 500);
    }
  } finally {
    session.endSession();
  }
}

export const getPublications = async (page: number, size: number): Promise<{ items: Publication[], totalCount: number }> => {
  validatePaginationDetails(page, size);
  const totalCount = await PublicationModel.countDocuments({ deleted: false });
  const publicationDocs = await PublicationModel
    .find(
      {
        deleted: false,
      }, 
      {
        type: 1,
        year: 1,
        description: 1, 
        url: 1,
        status: 1,
      })
    .sort({ year: -1 })
    .skip(page * size)
    .limit(size);

  return {
    items: mapDocumentsToPublications(publicationDocs),
    totalCount
  };
}

export const getGroupedPublications = async (): Promise<Record<string, Publication[]>> => {
  const allDocs = await PublicationModel
    .find(
      { 
        deleted: false, 
        status: DocumentStatus.ACTIVE
      },
      {
        type: 1,
        year: 1,
        description: 1, 
        url: 1,
        venue: 1,
        bibtex: 1,
      }
    ).sort(
      { year: -1 }
    );

  const grouped: Record<string, Publication[]> = {};
  for (const doc of allDocs) {
    const type = doc.type;
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(mapDocumentToPublication(doc));
  }

  return grouped;
};

export const getPublicationById = async (publicationId: string): Promise<Publication> => {
  const publicationDoc = await PublicationModel.findById(
    publicationId, 
    { 
      type: 1,
      year: 1,
      description: 1, 
      url: 1,
      venue: 1,
      bibtex: 1,
      status: 1,
      deleted: 1,
      createdAt: 1,
      updatedAt: 1,
      __v: 1
    }
  );

  if (publicationDoc) {
    return mapDocumentToPublication(publicationDoc);
  } else {
    throw new AppError(`A publication with id: ${publicationId} cannot be found`, 400);
  }
}
