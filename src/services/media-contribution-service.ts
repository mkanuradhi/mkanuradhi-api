import logger from "../config/logger-config";
import AppError from "../errors/app-error";
import AppUser from "../interfaces/i-app-user";
import MediaContribution, { LocalizedMediaContribution, LocalizedSummaryMediaContribution } from "../interfaces/i-media-contribution";
import MediaContributionModel from "../models/media-contribution-model";
import { generateUniquePath, localizeField, resolveLocale } from "../utils/common-util";
import { CreateMediaContributionDto } from "../validators/media-contribution-validator";
import { v4 as uuidv4 } from 'uuid';
import { invalidateSummaryStatsCache } from "./stat-service";
import { getCacheStrategy } from "../cache/cache-factory";
import { MEDIA_CONTRIBUTION_LIST_CACHE_KEY_PREFIX } from "../constants/common-vars";
import { mapDocumentToMediaContribution } from "../mappers/media-contribution-mapper";
import { validatePaginationDetails } from "../validators/common-validator";
import { Locale } from "../types/locale.types";
import DocumentStatus from "../enums/document-status";
import MediaContributionDocument from "../documents/media-contribution-document";

const MEDIA_CONTRIBUTION_LIST_CACHE_TTL_SECONDS = 60 * 60 * 6; // 6h
const MEDIA_CONTRIBUTION_DETAIL_CACHE_TTL_SECONDS = 60 * 60 * 6; // 6h

const mediaContributionListCacheKey = (locale: Locale, page: number, size: number) =>
  `${MEDIA_CONTRIBUTION_LIST_CACHE_KEY_PREFIX}${locale}:${page}:${size}`;
const mediaContributionDetailCacheKey = (path: string, locale: Locale) => `media-contribution:detail:${locale}:${path}`;

export const createMediaContribution = async (mediaContributionDto: CreateMediaContributionDto, appUser?: AppUser | null): Promise<MediaContribution> => {
  const titleTextEn = mediaContributionDto.title.en?.trim();
  if (!titleTextEn) throw new AppError('Title must have en locale.', 400);

  // duplicate check — title is the stable unique identifier
  const existingBookDoc = await MediaContributionModel.findOne({
    'title.en': titleTextEn,
    deleted: false
  });
  if (existingBookDoc) {
      throw new AppError(`A media contribution already exists with the title: ${titleTextEn}`, 400);
  }

  // generate unique path — checks DB for conflicts automatically
  const uniquePath = await generateUniquePath(
    titleTextEn,
    async (slug) => !!(await MediaContributionModel.exists({ path: slug }))
  );

  // generate id for each author — imageUrl not accepted on create
  const authorsWithIds = mediaContributionDto.authors?.map(author => ({
    id:         uuidv4(),
    name:       author.name,
    profileUrl: author.profileUrl,
    // imageUrl intentionally omitted — handled via separate upload endpoint
  }));

  const mediaContributionDoc = await MediaContributionModel.create({
    ...mediaContributionDto,
    authors:   authorsWithIds,
    path:      uniquePath,
    createdBy: appUser ?? undefined,
    updatedBy: appUser ?? undefined,
  });

  logger.info(`Media contribution created for ${titleTextEn}`);
  await invalidateSummaryStatsCache();
  await invalidateMediaContributionListCache();
  return mapDocumentToMediaContribution(mediaContributionDoc);
}

export const invalidateMediaContributionListCache = async (): Promise<void> => {
  const cache = getCacheStrategy();
  await cache.deleteByPrefix(MEDIA_CONTRIBUTION_LIST_CACHE_KEY_PREFIX);
};

export const getLocalizedMediaContributions = async (lang: string, page: number, size: number): Promise<{ items: LocalizedSummaryMediaContribution[], totalCount: number }> => {
  validatePaginationDetails(page, size);

  const locale = resolveLocale(lang);
  const cache = getCacheStrategy();
  const cacheKey = mediaContributionListCacheKey(locale, page, size);

  const cached = await cache.get<{ items: LocalizedSummaryMediaContribution[]; totalCount: number }>(cacheKey);
  if (cached) return cached;

  logger.info(`No cached media contribution list found for locale: ${lang}, hitting db to get media contributions list`);

  const [totalCount, bookDocs] = await Promise.all([
    MediaContributionModel.countDocuments({ deleted: false, status: DocumentStatus.ACTIVE }),
    MediaContributionModel
      .find(
        { deleted: false, status: DocumentStatus.ACTIVE },
        {
          title:         1,
          titleOriginal: 1,
          subtitle:      1,
          subtitleOriginal: 1,
          description:   1,
          writtenLang:   1,
          path:          1,
          outlet:        1,
          publishedDate: 1,
          topics:        1,
          coverImage:    1,
          featured:      1,
          displayOrder:  1,
        }
      )
      .sort({ displayOrder: 1, createdAt: -1 })
      .skip(page * size)
      .limit(size)
  ]);

  const result = {
    items: bookDocs.map(doc => toLocalizedSummaryMediaContribution(doc, locale)),
    totalCount,
  };

  await cache.set(cacheKey, result, MEDIA_CONTRIBUTION_LIST_CACHE_TTL_SECONDS);
  return result;
};

export const getLocalizedMediaContributionByPath = async (lang: string, path: string): Promise<LocalizedMediaContribution> => {
  const locale = resolveLocale(lang);
  const cache = getCacheStrategy();
  const cacheKey = mediaContributionDetailCacheKey(path.trim(), locale);

  const cached = await cache.get<LocalizedMediaContribution>(cacheKey);
  if (cached) return cached;

  logger.info(`No cached media contribution found for path: ${path}, hitting db to get media contributions list`);

  const mediaContributionDoc = await MediaContributionModel.findOne({
    path:    path.trim(),
    deleted: false,
    status:  DocumentStatus.ACTIVE,   // public only sees active books
  });

  if (!mediaContributionDoc) throw new AppError(`Media contribution not found for path: ${path}`, 404);

  const result = toLocalizedMediaContribution(mediaContributionDoc, locale);
  await cache.set(cacheKey, result, MEDIA_CONTRIBUTION_DETAIL_CACHE_TTL_SECONDS);

  logger.info(`Media contribution fetched by path: ${path}`);
  return result;
}

const toLocalizedSummaryMediaContribution = (doc: MediaContributionDocument, locale: Locale): LocalizedSummaryMediaContribution => {
  return {
    title:         localizeField(doc.title, locale),
    titleEn:       doc.title.en ?? '',
    titleOriginal: doc.titleOriginal,
    subtitle:      doc.subtitle ? localizeField(doc.subtitle, locale) : undefined,
    subtitleOriginal: doc.subtitleOriginal,
    description:   localizeField(doc.description, locale),
    path:          doc.path,
    language:   doc.language,
    outlet:     doc.outlet ? {
      name:     localizeField(doc.outlet.name, locale),
      webUrl:   doc.outlet.webUrl,
      imageUrl: doc.outlet.imageUrl,
    } : undefined,
    publishedDate: doc.publishedDate,
    topics:        doc.topics.map((s) => localizeField(s, locale)),
    coverImage:    doc.coverImage,
    featured:      doc.featured,
    displayOrder:  doc.displayOrder,
  };
};

const toLocalizedMediaContribution = (doc: MediaContributionDocument, locale: Locale): LocalizedMediaContribution => {
  return {
    id:            doc._id.toString(),
    title:         localizeField(doc.title, locale),
    titleEn:       doc.title.en ?? '',
    titleOriginal: doc.titleOriginal,
    subtitle:      doc.subtitle ? localizeField(doc.subtitle, locale) : undefined,
    subtitleEn:    doc.subtitle ? doc.subtitle.en : undefined,
    subtitleOriginal: doc.subtitleOriginal,
    description:   localizeField(doc.description, locale),
    content:       localizeField(doc.content, locale),
    type:          doc.type,
    role:          doc.role,
    topics:        doc.topics.map((s) => localizeField(s, locale)),
    authors:       doc.authors?.map(a => ({
      id:          a.id,
      name:        localizeField(a.name, locale),
      profileUrl:  a.profileUrl,
      imageUrl:    a.imageUrl,
    })),
    path:          doc.path,
    language:   doc.language,
    outlet:     {
      name:     localizeField(doc.outlet?.name, locale),
      webUrl:   doc.outlet?.webUrl,
      imageUrl: doc.outlet?.imageUrl,
    },
    publishedDate: doc.publishedDate,
    coverImage:    doc.coverImage,
    previewImages: doc.previewImages?.map(pi => ({
      id:      pi.id,
      url:     pi.url,
      displayOrder: pi.displayOrder,
    })),
    featured:      doc.featured,
  };
};
