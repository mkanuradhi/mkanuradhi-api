import { CreateAwardEnDto } from "../dtos/award-dto";
import AppError from "../errors/app-error";
import Award from "../interfaces/i-award";
import AwardModel from "../models/award-model";
import { mapDocumentToAward } from "../mappers/award-mapper";
import logger from "../config/logger-config";


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