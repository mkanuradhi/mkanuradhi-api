import { ActivationAwardDto, CreateAwardEnDto, UpdateAwardEnDto, UpdateAwardSiDto } from "../dtos/award-dto";
import AppError from "../errors/app-error";
import Award, { LocalizedAward } from "../interfaces/i-award";
import AwardView from "../interfaces/i-award-view";
import AwardModel from "../models/award-model";
import { mapDocumentsToAwards, mapDocumentsToAwardViews, mapDocumentToAward } from "../mappers/award-mapper";
import logger from "../config/logger-config";
import { validatePaginationDetails } from "../validators/common-validator";
import DocumentStatus from "../enums/document-status";
import { v4 as uuidv4 } from 'uuid';
import { SearchParamsDto } from "../dtos/search-params-dto";
import { Locale } from "../types/locale.types";
import { buildSearchFilter, capitalizeLang, resolveLocale, uploadImageToCloudService } from "../utils/common-util";
import AppUser from "../interfaces/i-app-user";
import { getCacheStrategy } from "../cache/cache-factory";
import { AWARD_LIST_CACHE_KEY_PREFIX } from "../constants/common-vars";
import AwardDocument from "../documents/award-document";
import { invalidateSummaryStatsCache } from "./stat-service";

const AWARD_LIST_CACHE_TTL_SECONDS = 60 * 60 * 6; // 6h
const awardListCacheKey = (locale: Locale, page: number, size: number) =>
  `${AWARD_LIST_CACHE_KEY_PREFIX}${locale}:${page}:${size}`;

export const createAwardEn = async (awardDto: CreateAwardEnDto, appUser?: AppUser | null): Promise<Award> => {
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

    createdBy: appUser || undefined,
    updatedBy: appUser || undefined,
  });

  logger.info(`Award created for ${awardDto.titleEn}`);
  await invalidateSummaryStatsCache();
  await invalidateAwardListCache();
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
      createdBy: 1,
      updatedBy: 1,
      __v: 1
    }
  );

  if (awardDoc) {
    return mapDocumentToAward(awardDoc);
  } else {
    throw new AppError(`Award cannot be found for id: ${awardId}`, 400);
  }
}

export const getLocalizedAwards = async (lang: string, page: number, size: number): Promise<{ items: LocalizedAward[], totalCount: number }> => {
  validatePaginationDetails(page, size);

  const locale = resolveLocale(lang);
  const cache = getCacheStrategy();
  const cacheKey = awardListCacheKey(locale, page, size);

  const cached = await cache.get<{ items: LocalizedAward[]; totalCount: number }>(cacheKey);
  if (cached) return cached;

  logger.info(`No cached awards list found for locale: ${lang}, hitting db to get awards list`);

  const localeProps: Record<string, number> = lang === 'si'
    ? {
        titleSi: 1,
        descriptionSi: 1,
        issuerSi: 1,
        issuerLocationSi: 1,
        ceremonyLocationSi: 1,
        coRecipientsSi: 1,
      }
    : {
        titleEn: 1,
        descriptionEn: 1,
        issuerEn: 1,
        issuerLocationEn: 1,
        ceremonyLocationEn: 1,
        coRecipientsEn: 1,
      };

  const [totalCount, awardDocs] = await Promise.all([
    AwardModel.countDocuments({ deleted: false, status: DocumentStatus.ACTIVE }),
    AwardModel
      .find(
        { deleted: false, status: DocumentStatus.ACTIVE },
        {
          ...localeProps,
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
        }
      )
      .sort({ displayOrder: 1, createdAt: -1 })
      .skip(page * size)
      .limit(size)
  ]);

  const result = {
    items: awardDocs.map(doc => toLocalizedAward(doc, locale)),
    totalCount,
  };

  await cache.set(cacheKey, result, AWARD_LIST_CACHE_TTL_SECONDS);
  return result;
};

const toLocalizedAward = (doc: AwardDocument, lang: string): LocalizedAward => {
  let coRecipientsProp = 'coRecipientsEn';
  if (lang === 'si') {
    coRecipientsProp = 'coRecipientsSi';
  }
  return {
    title:         getLocalizedField(doc, 'title', lang),
    description:   getLocalizedField(doc, 'description', lang),
    issuer:        getLocalizedField(doc, 'issuer', lang),
    issuerLocation: getLocalizedField(doc, 'issuerLocation', lang),
    ceremonyLocation: getLocalizedField(doc, 'ceremonyLocation', lang),
    coRecipients: lang === 'si' ? doc.coRecipientsSi : doc.coRecipientsEn,

    year: doc.year,
    receivedDate: doc.receivedDate,
    type: doc.type,
    scope: doc.scope,
    role: doc.role,
    result: doc.result,
    category: doc.category,
    eventUrl: doc.eventUrl,
    relatedWorkUrl: doc.relatedWorkUrl,
    monetaryValue: doc.monetaryValue,
    issuerImage: doc.issuerImage,
    primaryImage: doc.primaryImage,
  };
};

const getLocalizedField = (obj: any, prefix: string, lang: string): string => {
  const suffix = lang.charAt(0).toUpperCase() + lang.slice(1); // 'en' -> 'En', 'si' -> 'Si'
  return obj[`${prefix}${suffix}`];
};

export const updateAwardEn = async (awardId: string, awardDto: UpdateAwardEnDto, appUser?: AppUser | null): Promise<Award> => {
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

        updatedBy: appUser || undefined,
      },
      $inc: { __v: 1 }
    },
    { new: true }
  );

  if (!updatedAwardDoc) {
      throw new AppError('Failed to update award document.', 500);
  }

  logger.info(`Award updated for ID: ${awardId}`);
  await invalidateAwardListCache();
  return mapDocumentToAward(updatedAwardDoc);
}

export const updateAwardSi = async (awardId: string, awardDto: UpdateAwardSiDto, appUser?: AppUser | null): Promise<Award> => {
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
    year: existingAwardDoc.year,
    titleSi: awardDto.titleSi.trim(),
    descriptionSi: awardDto.descriptionSi.trim(),
    issuerSi: awardDto.issuerSi.trim(),
    deleted: false,
  });
  if (existingAwardDocsWithTitle && existingAwardDocsWithTitle.length > 0) {
    throw new AppError(`Existing award found for the year: ${existingAwardDoc.year}, title: ${awardDto.titleSi}, description: ${awardDto.descriptionSi} and issuer: ${awardDto.issuerSi}`, 400);
  }

  const updatedAwardDoc = await AwardModel.findByIdAndUpdate(
    awardId,
    { 
      $set: {
        titleSi: awardDto.titleSi,
        descriptionSi: awardDto.descriptionSi,
        issuerSi: awardDto.issuerSi,
        issuerLocationSi: awardDto.issuerLocationSi,
        ceremonyLocationSi: awardDto.ceremonyLocationSi,
        coRecipientsSi: awardDto.coRecipientsSi,
        updatedBy: appUser || undefined,
      },
      $inc: { __v: 1 }
    },
    { new: true }
  );

  if (!updatedAwardDoc) {
    throw new AppError('Failed to update award document.', 500);
  }

  logger.info(`Award updated for ID: ${awardId} and title Si: ${awardDto.titleSi}`);
  await invalidateAwardListCache();
  return mapDocumentToAward(updatedAwardDoc);
}

export const toggleAwardActivation = async (awardId: string, awardDto: ActivationAwardDto, appUser?: AppUser | null): Promise<Award> => {
  const existingAwardDoc = await AwardModel.findOne({
    _id: awardId,
    deleted: false,
  });
  if (!existingAwardDoc) {
      throw new AppError(`Cannot find the award with ID: ${awardId}. Unable to update the award.`, 400);
  }

  if (awardDto.status === DocumentStatus.ACTIVE) { // check sinhala details are available only when award is going to be activated
    if (!existingAwardDoc.titleSi?.trim() || !existingAwardDoc.descriptionSi?.trim() || !existingAwardDoc.issuerSi?.trim()) {
      throw new AppError("Missing or empty required fields in Sinhala: Either the title or description or issuer is missing.", 400);
    }
  }

  const updatedAwardDoc = await AwardModel.findByIdAndUpdate(
    awardId,
    { 
      $set: {
        status: awardDto.status,
        updatedBy: appUser || undefined,
      },
      $inc: { __v: 1 }
    },
    { new: true }
  );

  if (!updatedAwardDoc) {
      throw new AppError('Failed to update award document.', 500);
  }

  logger.info(`Award updated for status for ID: ${awardId}`);
  await invalidateSummaryStatsCache();
  await invalidateAwardListCache();
  return mapDocumentToAward(updatedAwardDoc);
}

export const uploadPrimaryImage = async (awardId: string, imageFile?: Express.Multer.File): Promise<Award> => {
  const awardDoc = await AwardModel.findOne({
    _id: awardId,
    deleted: false,
  });
  if (!awardDoc) {
    throw new AppError(`Cannot find award with ID '${awardId}'`, 404);
  }
  if (!imageFile) {
    throw new AppError('No primary image file provided.', 400);
  }

  const imageUrl = await uploadImageToCloudService(imageFile);
  if (!imageUrl) {
    throw new AppError("Failed to upload the primary image. Please try again.", 500);
  }

  awardDoc.set({
    primaryImage: imageUrl,
  });
  awardDoc.increment();
  await awardDoc.save();

  logger.info(`Uploaded primary image for award ID: ${awardId}`);
  await invalidateAwardListCache();
  return mapDocumentToAward(awardDoc);
}

export const uploadIssuerImage = async (awardId: string, imageFile?: Express.Multer.File, appUser?: AppUser | null): Promise<Award> => {
  const awardDoc = await AwardModel.findOne({
    _id: awardId,
    deleted: false,
  });
  if (!awardDoc) {
    throw new AppError(`Cannot find award with ID '${awardId}'`, 404);
  }
  if (!imageFile) {
    throw new AppError('No issuer image file provided.', 400);
  }

  const imageUrl = await uploadImageToCloudService(imageFile);
  if (!imageUrl) {
    throw new AppError("Failed to upload the issuer image to cloud. Please try again.", 500);
  }

  const updatedAwardDoc = await AwardModel.findByIdAndUpdate(
    awardId,
    {
      $set: {
        issuerImage: imageUrl,
        updatedBy: appUser || undefined,
      },
      $inc: { __v: 1 }
    },
    { new: true }
  );

  if (!updatedAwardDoc) {
      throw new AppError('Failed to update award with issuer image.', 500);
  }

  logger.info(`Uploaded issuer image for award ID: ${awardId}`);
  await invalidateAwardListCache();
  return mapDocumentToAward(updatedAwardDoc);
}

export const deleteAward = async (awardId: string, appUser?: AppUser | null): Promise<void> => {
  const awardDoc = await AwardModel.findOne({ 
    _id: awardId,
    deleted: false,
  });
  if (!awardDoc) {
    throw new AppError(`Cannot find the award with ID '${awardId}' or it is already deleted.`, 404);
  }

  const deletedTitleEn = `${awardDoc.titleEn}-DELETED-${uuidv4()}`;
  const deletedDescriptionEn = `${awardDoc.descriptionEn}-DELETED-${uuidv4()}`;
  const deletedTitleSi = `${awardDoc.titleSi}-DELETED-${uuidv4()}`;
  const deletedDescriptionSi = `${awardDoc.descriptionSi}-DELETED-${uuidv4()}`;

  const updatedAwardDoc = await AwardModel.findByIdAndUpdate(
    awardId,
    {
      $set: {
        titleEn: deletedTitleEn,
        descriptionEn: deletedDescriptionEn,
        titleSi: deletedTitleSi,
        descriptionSi: deletedDescriptionSi,
        updatedBy: appUser || undefined,
        deleted: true,
      },
      $inc: { __v: 1 }
    },
    { new: true }
  );
  if (!updatedAwardDoc) {
    throw new AppError('Failed to delete award document.', 500);
  }
  await invalidateSummaryStatsCache();
  await invalidateAwardListCache();
}

export const deletePrimaryImage = async (awardId: string, appUser?: AppUser | null): Promise<Award> => {
  const awardDoc = await AwardModel.findOne({ 
    _id: awardId,
    deleted: false,
  });
  if (!awardDoc) {
    throw new AppError(`Cannot find the award with ID '${awardId}' or it is already deleted.`, 404);
  }

  const updatedAwardDoc = await AwardModel.findByIdAndUpdate(
    awardId,
    {
      $set: {
        primaryImage: null,
        updatedBy: appUser || undefined,
      },
      $inc: { __v: 1 }
    },
    { new: true }
  );
  if (!updatedAwardDoc) {
    throw new AppError('Failed to delete the primary image of the award document.', 500);
  }

  logger.info(`Deleted the primary image of the award for ID: ${awardId}`);
  await invalidateAwardListCache();
  return mapDocumentToAward(updatedAwardDoc);
}

export const deleteIssuerImage = async (awardId: string, appUser?: AppUser | null): Promise<Award> => {
  const awardDoc = await AwardModel.findOne({ 
    _id: awardId,
    deleted: false,
  });
  if (!awardDoc) {
    throw new AppError(`Cannot find the award with ID '${awardId}' or it is already deleted.`, 404);
  }

  const updatedAwardDoc = await AwardModel.findByIdAndUpdate(
    awardId,
    {
      $set: {
        issuerImage: null,
        updatedBy: appUser || undefined,
      },
      $inc: { __v: 1 }
    },
    { new: true }
  );
  if (!updatedAwardDoc) {
    throw new AppError('Failed to delete the issuer image of the award document.', 500);
  }

  logger.info(`Deleted the issuer image of the award for ID: ${awardId}`);
  await invalidateAwardListCache();
  return mapDocumentToAward(updatedAwardDoc);
}

export const searchAwards = async (lang: string, searchParams: SearchParamsDto): Promise<{ awardViews: AwardView[]; totalCount: number; }> => {
  const {page = 0, size = 200, sort} = searchParams;
  
  validatePaginationDetails(page, size);

  const searchFilter = buildSearchFilter(searchParams);
  const sortOptions = getSortOptions(sort);

  const commonFields = {
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
    v: 1,
  };

  const langFields = {
    [`title${capitalizeLang(lang)}`]: 1,
    [`description${capitalizeLang(lang)}`]: 1,
    [`issuer${capitalizeLang(lang)}`]: 1,
    [`issuerLocation${capitalizeLang(lang)}`]: 1,
    [`ceremonyLocation${capitalizeLang(lang)}`]: 1,
    [`coRecipients${capitalizeLang(lang)}`]: 1,
  };

  const projection = { ...commonFields, ...langFields };
  
  const [awardDocs, totalCount] = await Promise.all([
    // Fetch paginated awards
    AwardModel.find(searchFilter, projection)
      .sort(sortOptions)
      .skip(page * size)
      .limit(size),
    
    // Count total documents for the query
    AwardModel.countDocuments(searchFilter),
  ]);

  const awardViews: AwardView[] = mapDocumentsToAwardViews(lang, awardDocs);

  return { awardViews, totalCount };
}

const getSortOptions = (sort?: string): Record<string, 1 | -1> => {
  const defaultSort: Record<string, 1 | -1> = { year: -1, receivedDate: -1, updatedAt: -1 };
  if (!sort) {
    return defaultSort;
  }

  switch (sort) {
    case "latest": return { year: -1 };
    case "oldest": return { year: 1 };
    default: return defaultSort;
  }
}

export const invalidateAwardListCache = async (): Promise<void> => {
  const cache = getCacheStrategy();
  await cache.deleteByPrefix(AWARD_LIST_CACHE_KEY_PREFIX);
};
