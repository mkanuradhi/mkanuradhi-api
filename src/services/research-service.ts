import { ActivationResearchDto, CreateResearchDto, UpdateResearchDto } from "../dtos/research-dto";
import AppError from "../errors/app-error";
import Research from "../interfaces/i-research";
import ResearchModel from "../models/research-model";
import logger from "../config/logger-config";
import { mapDocumentsToResearches, mapDocumentToResearch } from "../mappers/research-mapper";
import { validatePaginationDetails } from "../validators/common-validator";
import { v4 as uuidv4 } from 'uuid';
import { LabelValueStat, SummaryStat } from "../interfaces/i-stat";
import DocumentStatus from "../enums/document-status";
import DegreeType from "../enums/degree-type";
import SupervisionStatus from "../enums/supervision-status";

export const createResearch = async (researchDto: CreateResearchDto): Promise<Research> => {
  const session = await ResearchModel.startSession();

  try {
    session.startTransaction();

    const existingResearchDoc = await ResearchModel.findOne({
      year: researchDto.completedYear,
      title: researchDto.title?.trim(),
      deleted: false
    }).session(session);

    if (existingResearchDoc) {
      throw new AppError(`Existing research title: ${researchDto.title}, found for the year: ${researchDto.completedYear}`, 400);
    }

    const [researchDoc] = await ResearchModel.create([{
      type: researchDto.type,
      degree: researchDto.degree,
      completedYear: researchDto.completedYear,
      title: researchDto.title,
      location: researchDto.location,
      abstract: researchDto.abstract,
      supervisors: researchDto.supervisors,
      keywords: researchDto.keywords,
      thesisUrl: researchDto.thesisUrl,
      githubUrl: researchDto.githubUrl,
      slidesUrl: researchDto.slidesUrl,
      studentName: researchDto.studentName,
      supervisionStatus: researchDto.supervisionStatus,
      registrationNumber: researchDto.registrationNumber,
      startedDate: researchDto.startedDate,
      completedDate: researchDto.completedDate,
      isMine: researchDto.isMine,
    }], { session });

    await session.commitTransaction();

    logger.info(`Research created for ${researchDto.completedYear}`);
    return mapDocumentToResearch(researchDoc);
  } catch (error) {
    await session.abortTransaction();
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(`Research creation failed: ${error.message}`, 500);
    } else {
      throw new AppError("Research creation failed", 500);
    }
  } finally {
    session.endSession();
  }
}

export const getResearches = async (page: number, size: number): Promise<{ items: Research[], totalCount: number }> => {
  validatePaginationDetails(page, size);
  const totalCount = await ResearchModel.countDocuments({ deleted: false });
  const researchDocs = await ResearchModel
    .find(
      {
        deleted: false,
      }, 
      {
        type: 1,
        degree: 1,
        completedYear: 1,
        title: 1,
        location: 1,
        abstract: 1,
        supervisors: 1,
        keywords: 1,
        thesisUrl: 1,
        githubUrl: 1,
        slidesUrl: 1,
        studentName: 1,
        supervisionStatus: 1,
        registrationNumber: 1,
        startedDate: 1,
        completedDate: 1,
        isMine: 1,
        status: 1,
      })
    .sort({ updatedAt: -1 })
    .skip(page * size)
    .limit(size);

  return {
    items: mapDocumentsToResearches(researchDocs),
    totalCount
  };
}

export const getResearchById = async (researchId: string): Promise<Research> => {
  const researchDoc = await ResearchModel.findById(
    researchId, 
    { 
      type: 1,
      degree: 1,
      completedYear: 1,
      title: 1,
      location: 1,
      abstract: 1,
      supervisors: 1,
      keywords: 1,
      thesisUrl: 1,
      githubUrl: 1,
      slidesUrl: 1,
      studentName: 1,
      supervisionStatus: 1,
      registrationNumber: 1,
      startedDate: 1,
      completedDate: 1,
      isMine: 1,
      status: 1,
      deleted: 1,
      createdAt: 1,
      updatedAt: 1,
      __v: 1
    }
  );

  if (researchDoc) {
    return mapDocumentToResearch(researchDoc);
  } else {
    throw new AppError(`A research with id: ${researchId} cannot be found`, 400);
  }
}

export const updateResearch = async (researchId: string, researchDto: UpdateResearchDto): Promise<Research> => {
  const existingResearchDoc = await ResearchModel.findOne({
    _id: researchId,
    deleted: false,
  });
  if (!existingResearchDoc) {
      throw new AppError(`Cannot find the research with ID: ${researchId}. Unable to update the research.`, 400);
  }
  if (existingResearchDoc.__v !== researchDto.v) {
    throw new AppError(`Research has been modified by another process. Please refresh and try again.`, 409);
  }

  const existingResearchDocsWithSameData = await ResearchModel.find({
    _id: { $ne: researchId },
    completedYear: researchDto.completedYear,
    title: researchDto.title.trim(),
    deleted: false,
  });
  if (existingResearchDocsWithSameData && existingResearchDocsWithSameData.length > 0) {
    throw new AppError(`Existing research found with the title: ${researchDto.title} for the year: ${researchDto.completedYear}`, 400);
  }

  const updatedResearchDoc = await ResearchModel.findByIdAndUpdate(
    researchId,
    { 
      $set: {
        type: researchDto.type,
        degree: researchDto.degree,
        completedYear: researchDto.completedYear,
        title: researchDto.title,
        location: researchDto.location,
        abstract: researchDto.abstract,
        supervisors: researchDto.supervisors,
        keywords: researchDto.keywords,
        thesisUrl: researchDto.thesisUrl,
        githubUrl: researchDto.githubUrl,
        slidesUrl: researchDto.slidesUrl,
        studentName: researchDto.studentName,
        supervisionStatus: researchDto.supervisionStatus,
        registrationNumber: researchDto.registrationNumber,
        startedDate: researchDto.startedDate,
        completedDate: researchDto.completedDate,
        isMine: researchDto.isMine,
      },
      $inc: { __v: 1 }
    },
    { new: true, runValidators: true }
  );

  if (!updatedResearchDoc) {
      throw new AppError('Failed to update research document.', 500);
  }

  logger.info(`Research updated for ID: ${researchId}`);
  return mapDocumentToResearch(updatedResearchDoc);
}

export const toggleResearchActivation = async (researchId: string, researchDto: ActivationResearchDto): Promise<Research> => {
  const existingResearchDoc = await ResearchModel.findOne({
    _id: researchId,
    deleted: false,
  });
  if (!existingResearchDoc) {
      throw new AppError(`Cannot find the research with ID: ${researchId}. Unable to update the research.`, 400);
  }

  const updatedResearchDoc = await ResearchModel.findByIdAndUpdate(
    researchId,
    { 
      $set: {
        status: researchDto.status,
      },
      $inc: { __v: 1 }
    },
    { new: true, runValidators: true }
  );

  if (!updatedResearchDoc) {
      throw new AppError('Failed to update research document.', 500);
  }

  logger.info(`Research updated for status for ID: ${researchId}`);
  return mapDocumentToResearch(updatedResearchDoc);
}

export const deleteResearch = async (researchId: string): Promise<void> => {
  const researchDoc = await ResearchModel.findOne({ 
    _id: researchId,
    deleted: false,
  });
  if (!researchDoc) {
    throw new AppError(`Cannot find the research with ID '${researchId}' or it is already deleted.`, 404);
  }

  const deletedTitle = `${researchDoc.title}-DELETED-${uuidv4()}`;

  const updatedResearchDoc = await ResearchModel.findByIdAndUpdate(
    researchId,
    {
      $set: {
        title: deletedTitle,
        deleted: true,
      },
      $inc: { __v: 1 }
    },
    { new: true }
  );
  if (!updatedResearchDoc) {
    throw new AppError('Failed to delete research document.', 500);
  }
  logger.info(`Research deleted for id: ${researchId}`);
}

export const getResearchSummary = async (): Promise<SummaryStat> => {
  const matchStage = {
    deleted: false,
    status : DocumentStatus.ACTIVE,
  };

  const [result] = await ResearchModel.aggregate<{
    total:               { value: number }[];
    byType:              LabelValueStat[];
    bySupervisionStatus: LabelValueStat[];
  }>([
    { $match: matchStage },

    {
      $facet: {
        total: [{ $count: 'value' }],

        byType: [
          { $group: { _id: '$type', value: { $sum: 1 } } },
          { $project: { _id: 0, label: '$_id', value: 1 } },
        ],

        bySupervisionStatus: [
          { $group: { _id: '$supervisionStatus', value: { $sum: 1 } } },
          { $project: { _id: 0, label: '$_id', value: 1 } },
        ],
      },
    },
  ]);

  // post-process to ensure ALL enum values appear

  // 1. Total
  const stats: LabelValueStat[] = [
    { label: 'Total', value: result.total[0]?.value ?? 0 },
  ];

  // 2.a By-type – guarantee every DegreeType enum key exists
  const valueByType = new Map(result.byType.map(e => [e.label, e.value]));
  const byType: LabelValueStat[] = (
    Object.values(DegreeType) as DegreeType[]
  ).map(label => ({
    label,
    value: valueByType.get(label) ?? 0,
  }));

  // 2.b By-status – guarantee every SupervisionStatus enum key exists
  const valueByStatus = new Map(
    result.bySupervisionStatus.map(e => [e.label, e.value]),
  );
  const bySupervisionStatus: LabelValueStat[] = (
    Object.values(SupervisionStatus) as SupervisionStatus[]
  ).map(label => ({
    label,
    value: valueByStatus.get(label) ?? 0,
  }));

  return {
    stats,
    grouped: {
      byType,
      bySupervisionStatus,
    },
  };
};
