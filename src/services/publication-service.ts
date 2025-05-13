import logger from "../config/logger-config";
import Publication from "../interfaces/i-publication";
import { ActivationPublicationDto, CreatePublicationDto, UpdatePublicationDto } from "../dtos/publication-dto";
import PublicationModel from "../models/publication-model";
import AppError from "../errors/app-error";
import { mapDocumentsToPublications, mapDocumentToPublication } from "../mappers/publication-mapper";
import { validatePaginationDetails } from "../validators/common-validator";
import DocumentStatus from "../enums/document-status";
import { v4 as uuidv4 } from 'uuid';


export const createPublication = async (publicationDto: CreatePublicationDto): Promise<Publication> => {
  const session = await PublicationModel.startSession();

  try {
    session.startTransaction();

    const existingPublicationDoc = await PublicationModel.findOne({
      year: publicationDto.year,
      title: publicationDto.title?.trim(),
      deleted: false
    }).session(session);

    if (existingPublicationDoc) {
      throw new AppError(`Existing publication title: ${publicationDto.title}, found for the year: ${publicationDto.year}`, 400);
    }

    const [publicationDoc] = await PublicationModel.create([{
      type: publicationDto.type,
      year: publicationDto.year,
      title: publicationDto.title,
      description: publicationDto.description,
      source: publicationDto.source,
      authors: publicationDto.authors,
      publicationStatus: publicationDto.publicationStatus,
      tags: publicationDto.tags,
      publicationUrl: publicationDto.publicationUrl,
      pdfUrl: publicationDto.pdfUrl,
      doiUrl: publicationDto.doiUrl,
      arxivUrl: publicationDto.arxivUrl,
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
        title: 1,
        description: 1, 
        source: 1,
        authors: 1,
        publicationStatus: 1,
        tags: 1,
        publicationUrl: 1,
        pdfUrl: 1,
        doiUrl: 1,
	      arxivUrl: 1,
        bibtex: 1,
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
        title: 1,
        description: 1, 
        source: 1,
        authors: 1,
        publicationStatus: 1,
        tags: 1,
        publicationUrl: 1,
        pdfUrl: 1,
        doiUrl: 1,
	      arxivUrl: 1,
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
      source: 1,
      authors: 1,
      publicationStatus: 1,
      tags: 1,
      publicationUrl: 1,
      pdfUrl: 1,
      doiUrl: 1,
      arxivUrl: 1,
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

export const updatePublication = async (publicationId: string, publicationDto: UpdatePublicationDto): Promise<Publication> => {
  const existingPublicationDoc = await PublicationModel.findOne({
    _id: publicationId,
    deleted: false,
  });
  if (!existingPublicationDoc) {
      throw new AppError(`Cannot find the publication with ID: ${publicationId}. Unable to update the publication.`, 400);
  }
  if (existingPublicationDoc.__v !== publicationDto.v) {
    throw new AppError(`Publication has been modified by another process. Please refresh and try again.`, 409);
  }

  const existingPublicationDocsWithSameData = await PublicationModel.find({
    _id: { $ne: publicationId },
    year: publicationDto.year,
    title: publicationDto.title.trim(),
    deleted: false,
  });
  if (existingPublicationDocsWithSameData && existingPublicationDocsWithSameData.length > 0) {
    throw new AppError(`Existing publication found with the title: ${publicationDto.title} for the year: ${publicationDto.year}`, 400);
  }

  const updatedPublicationDoc = await PublicationModel.findByIdAndUpdate(
    publicationId,
    { 
      $set: {
        type: publicationDto.type,
        year: publicationDto.year,
        title: publicationDto.title,
        description: publicationDto.description,
        source: publicationDto.source,
        authors: publicationDto.authors,
        publicationStatus: publicationDto.publicationStatus,
        tags: publicationDto.tags,
        publicationUrl: publicationDto.publicationUrl,
        pdfUrl: publicationDto.pdfUrl,
        doiUrl: publicationDto.doiUrl,
        arxivUrl: publicationDto.arxivUrl,
        bibtex: publicationDto.bibtex,
      },
      $inc: { __v: 1 }
    },
    { new: true, runValidators: true }
  );

  if (!updatedPublicationDoc) {
      throw new AppError('Failed to update publication document.', 500);
  }

  logger.info(`Publication updated for ID: ${publicationId}`);
  return mapDocumentToPublication(updatedPublicationDoc);
}

export const togglePublicationActivation = async (publicationId: string, publicationDto: ActivationPublicationDto): Promise<Publication> => {
  const existingPublicationDoc = await PublicationModel.findOne({
    _id: publicationId,
    deleted: false,
  });
  if (!existingPublicationDoc) {
      throw new AppError(`Cannot find the publication with ID: ${publicationId}. Unable to update the publication.`, 400);
  }

  const updatedPublicationDoc = await PublicationModel.findByIdAndUpdate(
    publicationId,
    { 
      $set: {
        status: publicationDto.status,
      },
      $inc: { __v: 1 }
    },
    { new: true, runValidators: true }
  );

  if (!updatedPublicationDoc) {
      throw new AppError('Failed to update publication document.', 500);
  }

  logger.info(`Publication updated for status for ID: ${publicationId}`);
  return mapDocumentToPublication(updatedPublicationDoc);
}

export const deletePublication = async (publicationId: string): Promise<void> => {
  const publicationDoc = await PublicationModel.findOne({ 
    _id: publicationId,
    deleted: false,
  });
  if (!publicationDoc) {
    throw new AppError(`Cannot find the publication with ID '${publicationId}' or it is already deleted.`, 404);
  }

  const deletedTitle = `${publicationDoc.title}-DELETED-${uuidv4()}`;

  const updatedPublicationDoc = await PublicationModel.findByIdAndUpdate(
    publicationId,
    {
      $set: {
        title: deletedTitle,
        deleted: true,
      },
      $inc: { __v: 1 }
    },
    { new: true }
  );
  if (!updatedPublicationDoc) {
    throw new AppError('Failed to delete publication document.', 500);
  }
  logger.info(`Publication deleted for id: ${publicationId}`);
}
