import { CreateResearchDto } from "../dtos/research-dto";
import AppError from "../errors/app-error";
import Research from "../interfaces/i-research";
import ResearchModel from "../models/research-model";
import logger from "../config/logger-config";
import { mapDocumentToResearch } from "../mappers/research-mapper";

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