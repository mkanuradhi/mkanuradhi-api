import { CreateAwardEnDto, UpdateAwardEnDto } from "../dtos/award-dto";
import AppError from "../errors/app-error";
import Award from "../interfaces/i-award";
import AwardModel from "../models/award-model";
import { mapDocumentsToAwards, mapDocumentToAward } from "../mappers/award-mapper";
import logger from "../config/logger-config";
import { validatePaginationDetails } from "../validators/common-validator";


export const createAwardEn = async (awardDto: CreateAwardEnDto): Promise<Award> => {
  const existingAwardDoc = await AwardModel.findOne({
    titleEn: awardDto.titleEn.trim(),
    descriptionEn: awardDto.descriptionEn.trim(),
    type: awardDto.type,
    deleted: false
  });
  if (existingAwardDoc) {
      throw new AppError(`Existing award found for the title: ${awardDto.titleEn} and type: ${awardDto.type}`, 400);
  }

  const awardDoc = await AwardModel.create({
    titleEn: awardDto.titleEn,
    descriptionEn: awardDto.descriptionEn,
    issuerEn: awardDto.issuerEn,
    issuerLocationEn: awardDto.issuerLocationEn,
    ceremonyLocationEn: awardDto.ceremonyLocationEn,
    coRecipientsEn: awardDto.coRecipientsEn,

    year: awardDto.year,
    receivedDate: awardDto.receivedDate,
    type: awardDto.type,
    scope: awardDto.scope,
    role: awardDto.role,
    result: awardDto.result,
    category: awardDto.category,

    eventUrl: awardDto.eventUrl,
    relatedWorkUrl: awardDto.relatedWorkUrl,
    monetaryValue: awardDto.monetaryValue,
  });

  logger.info(`Award created for ${awardDto.titleEn}`);
  return mapDocumentToAward(awardDoc);
}

export const getAwards = async (page: number, size: number): Promise<{ items: Award[], totalCount: number }> => {
  validatePaginationDetails(page, size);
  const totalCount = await AwardModel.countDocuments({ deleted: false });
  const awardDocs = await AwardModel
    .find(
      { deleted: false  }, 
      {
        titleEn: 1,
        descriptionEn: 1,
        issuerEn: 1,
        issuerLocationEn: 1,
        ceremonyLocationEn: 1,
        coRecipientsEn: 1,
        titleSi: 1,
        descriptionSi: 1,
        issuerSi: 1,
        issuerLocationSi: 1,
        ceremonyLocationSi: 1,
        coRecipientsSi: 1,
        year: 1,
        receivedDate: 1,
        type: 1,
        scope: 1,
        role: 1,
        result: 1,
        category: 1,
        eventUrl: 1,
        relatedWorkUrl: 1,
        monetaryValue: 1,
        issuerImage: 1,
        primaryImage: 1,
        status: 1,
      })
    .sort({ year: -1, receivedDate: -1 })
    .skip(page * size)
    .limit(size);

  return {
    items: mapDocumentsToAwards(awardDocs),
    totalCount
  };
}

export const getAward = async (awardId: string): Promise<Award> => {
  const awardDoc = await AwardModel.findById(
    awardId, 
    { 
      titleEn: 1,
      descriptionEn: 1,
      issuerEn: 1,
      issuerLocationEn: 1,
      ceremonyLocationEn: 1,
      coRecipientsEn: 1,
      titleSi: 1,
      descriptionSi: 1,
      issuerSi: 1,
      issuerLocationSi: 1,
      ceremonyLocationSi: 1,
      coRecipientsSi: 1,
      year: 1,
      receivedDate: 1,
      type: 1,
      scope: 1,
      role: 1,
      result: 1,
      category: 1,
      eventUrl: 1,
      relatedWorkUrl: 1,
      monetaryValue: 1,
      issuerImage: 1,
      primaryImage: 1,
      status: 1,
      deleted: 1,
      createdAt: 1,
      updatedAt: 1,
      __v: 1
    }
  );

  if (awardDoc) {
    return mapDocumentToAward(awardDoc);
  } else {
    throw new AppError(`Award cannot be found for id: ${awardId}`, 400);
  }
}

export const updateAwardEn = async (awardId: string, awardDto: UpdateAwardEnDto): Promise<Award> => {
  const existingAwardDoc = await AwardModel.findOne({
    _id: awardId,
    deleted: false,
  });
  if (!existingAwardDoc) {
      throw new AppError(`Cannot find the award with ID: ${awardId}. Unable to update the award.`, 400);
  }
  if (existingAwardDoc.__v !== awardDto.v) {
    throw new AppError(`Award has been modified by another process. Please refresh and try again.`, 409);
  }

  const existingAwardDocsWithTitle = await AwardModel.find({
    _id: { $ne: awardId },
    titleEn: awardDto.titleEn.trim(),
    descriptionEn: awardDto.descriptionEn.trim(),
    issuerEn: awardDto.issuerEn.trim(),
    deleted: false,
  });
  if (existingAwardDocsWithTitle && existingAwardDocsWithTitle.length > 0) {
    throw new AppError(`Existing award found for the title: ${awardDto.titleEn}, description: ${awardDto.descriptionEn} and issuer: ${awardDto.issuerEn}`, 400);
  }

  const updatedAwardDoc = await AwardModel.findByIdAndUpdate(
    awardId,
    { 
      $set: {
        titleEn: awardDto.titleEn,
        descriptionEn: awardDto.descriptionEn,
        issuerEn: awardDto.issuerEn,
        issuerLocationEn: awardDto.issuerLocationEn,
        ceremonyLocationEn: awardDto.ceremonyLocationEn,
        coRecipientsEn: awardDto.coRecipientsEn,

        year: awardDto.year,
        receivedDate: awardDto.receivedDate,
        type: awardDto.type,
        scope: awardDto.scope,
        role: awardDto.role,
        result: awardDto.result,
        category: awardDto.category,

        eventUrl: awardDto.eventUrl,
        relatedWorkUrl: awardDto.relatedWorkUrl,
        monetaryValue: awardDto.monetaryValue,
      },
      $inc: { __v: 1 }
    },
    { new: true }
  );

  if (!updatedAwardDoc) {
      throw new AppError('Failed to update award document.', 500);
  }

  logger.info(`Award updated for ID: ${awardId}`);
  return mapDocumentToAward(updatedAwardDoc);
}
