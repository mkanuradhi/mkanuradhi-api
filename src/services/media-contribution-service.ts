import logger from "../config/logger-config";
import AppError from "../errors/app-error";
import AppUser from "../interfaces/i-app-user";
import MediaContribution, { LocalizedMediaContribution, LocalizedSummaryMediaContribution, MediaContributionPreviewImage } from "../interfaces/i-media-contribution";
import MediaContributionModel from "../models/media-contribution-model";
import { generateUniquePath, localizeField, resolveLocale, uploadImageToCloudService } from "../utils/common-util";
import { ActivationMediaContributionDto, CreateMediaContributionDto, MAX_MEDIA_CONTRIBUTION_PREVIEW_IMAGES, UpdateMediaContributionDto } from "../validators/media-contribution-validator";
import { v4 as uuidv4 } from 'uuid';
import { invalidateSummaryStatsCache } from "./stat-service";
import { getCacheStrategy } from "../cache/cache-factory";
import { MEDIA_CONTRIBUTION_LIST_CACHE_KEY_PREFIX } from "../constants/common-vars";
import { mapDocumentsToMediaContributions, mapDocumentToMediaContribution } from "../mappers/media-contribution-mapper";
import { ReorderPreviewImagesDto, validatePaginationDetails } from "../validators/common-validator";
import { Locale, SUPPORTED_LOCALES } from "../types/locale.types";
import DocumentStatus from "../enums/document-status";
import MediaContributionDocument from "../documents/media-contribution-document";
import { deleteFileFromR2, uploadFileToR2 } from "../utils/r2-util";

const MEDIA_CONTRIBUTION_LIST_CACHE_TTL_SECONDS = 60 * 60 * 6; // 6h
const MEDIA_CONTRIBUTION_DETAIL_CACHE_TTL_SECONDS = 60 * 60 * 6; // 6h

const mediaContributionListCacheKey = (locale: Locale, page: number, size: number) =>
  `${MEDIA_CONTRIBUTION_LIST_CACHE_KEY_PREFIX}${locale}:${page}:${size}`;
const mediaContributionDetailCacheKey = (path: string, locale: Locale) => `media-contribution:detail:${locale}:${path}`;

export const getMediaContributions = async (page: number, size: number): Promise<{ items: MediaContribution[], totalCount: number }> => {
  validatePaginationDetails(page, size);
  const [totalCount, mediaContributionDocs] = await Promise.all([
    MediaContributionModel.countDocuments({ deleted: false }),
    MediaContributionModel
      .find(
        { deleted: false  }, 
        {
          title: 1,
          titleOriginal: 1,
          subtitle: 1,
          subtitleOriginal: 1,
          description: 1,
          authors: 1,
          language: 1,
          path: 1,
          publishedDate: 1,
          coverImage: 1,
          featured: 1,
          displayOrder: 1,
          status: 1,
        })
      .sort({ displayOrder: 1, createdAt: -1  })
      .skip(page * size)
      .limit(size)
  ]);
  return {
    items: mapDocumentsToMediaContributions(mediaContributionDocs),
    totalCount
  };
}

export const getMediaContribution = async (mediaContributionId: string): Promise<MediaContribution> => {
  const mediaContributionDoc = await MediaContributionModel.findOne({
    _id:     mediaContributionId,
    deleted: false,
  });

  if (!mediaContributionDoc) throw new AppError(`Media contribution not found for id: ${mediaContributionId}`, 404);

  return mapDocumentToMediaContribution(mediaContributionDoc);
}

export const createMediaContribution = async (mediaContributionDto: CreateMediaContributionDto, appUser?: AppUser | null): Promise<MediaContribution> => {
  const titleTextEn = mediaContributionDto.title.en?.trim();
  if (!titleTextEn) throw new AppError('Title must have en locale.', 400);

  // duplicate check — title is the stable unique identifier
  const existingMediaContributionDoc = await MediaContributionModel.findOne({
    'title.en': titleTextEn,
    deleted: false
  });
  if (existingMediaContributionDoc) {
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
    isMe:       author.isMe,
    profileUrl: author.profileUrl,
    // imageUrl intentionally omitted — handled via separate upload endpoint
  }));

  // generate id for each interviewer — imageUrl not accepted on create
  const interviewersWithIds = mediaContributionDto.interviewers?.map(interviewer => ({
    id:         uuidv4(),
    name:       interviewer.name,
    profileUrl: interviewer.profileUrl,
    // imageUrl intentionally omitted — handled via separate upload endpoint
  }));

  const mediaContributionDoc = await MediaContributionModel.create({
    ...mediaContributionDto,
    authors:   authorsWithIds,
    interviewers: interviewersWithIds,
    path:      uniquePath,
    createdBy: appUser ?? undefined,
    updatedBy: appUser ?? undefined,
  });

  logger.info(`Media contribution created for ${titleTextEn}`);
  await invalidateSummaryStatsCache();
  await invalidateMediaContributionListCache();
  return mapDocumentToMediaContribution(mediaContributionDoc);
}

export const updateMediaContribution = async (mediaContributionId: string, mediaContributionDto: UpdateMediaContributionDto, appUser?: AppUser | null): Promise<MediaContribution> => {
  // Verify media contribution exists first
  const existingMediaContributionDoc = await MediaContributionModel.findOne({ _id: mediaContributionId, deleted: false });
  if (!existingMediaContributionDoc) throw new AppError(`Media contribution not found for id: ${mediaContributionId}`, 404);

  const titleTextEn = mediaContributionDto.title?.en?.trim();
  if (!titleTextEn) throw new AppError('Title must have en locale.', 400);

  // Duplicate title check — exclude current doc
  const existingDuplicateDoc = await MediaContributionModel.findOne({
    'title.en': titleTextEn,
    _id:        { $ne: mediaContributionId }, // exclude the current doc
    deleted:    false,
  });
  if (existingDuplicateDoc) {
    throw new AppError(`A media contribution already exists with the title: "${titleTextEn}"`, 400);
  }

  const mergedAuthors = getMergedAuthors(mediaContributionDto, existingMediaContributionDoc);
  const mergedInterviewers = getMergedInterviewers(mediaContributionDto, existingMediaContributionDoc);
  const mergedOutlet = getMergedOutlet(mediaContributionDto, existingMediaContributionDoc);
  const mergedPreviewImages = getMergedPreviewImages(mediaContributionDto, existingMediaContributionDoc);

  const mediaContributionDoc = await MediaContributionModel.findOneAndUpdate(
    { _id: mediaContributionId, __v: mediaContributionDto.v, deleted: false },  // atomic version check
    {
      $set: {
        title:         mediaContributionDto.title,
        titleOriginal: mediaContributionDto.titleOriginal,
        subtitle:      mediaContributionDto.subtitle,
        subtitleOriginal: mediaContributionDto.subtitleOriginal,
        description:   mediaContributionDto.description,
        content:       mediaContributionDto.content,
        type:          mediaContributionDto.type,
        role:          mediaContributionDto.role,
        topics:        mediaContributionDto.topics,
        authors:       mergedAuthors,
        language:      mediaContributionDto.language,
        interviewers:  mergedInterviewers,
        outlet:        mergedOutlet,
        publishedDate: mediaContributionDto.publishedDate,
        durationSeconds: mediaContributionDto.durationSeconds,
        highlightQuote:  mediaContributionDto.highlightQuote,
        previewImages: mergedPreviewImages,
        sourceUrl:     mediaContributionDto.sourceUrl,
        featured:      mediaContributionDto.featured,
        displayOrder:  mediaContributionDto.displayOrder,
        updatedBy:     appUser ?? undefined,
      },
      $inc: { __v: 1 },
    },
    { new: true, runValidators: true }
  );

  if (!mediaContributionDoc) {
    throw new AppError('Media contribution was modified by another request. Please refresh and try again.', 409);
  }

  logger.info(`Media contribution updated: ${mediaContributionId}`);
  await invalidateMediaContributionDetailCache(mediaContributionDoc.path);
  await invalidateMediaContributionListCache();
  return mapDocumentToMediaContribution(mediaContributionDoc);
}

const getMergedAuthors = (mediaContributionDto: UpdateMediaContributionDto, existingMediaContributionDoc: MediaContributionDocument) => {
  const existingAuthorMap = new Map(
    existingMediaContributionDoc.authors?.map(a => [a.id, a])
  );

  return mediaContributionDto.authors?.map(dtoAuthor => {
    if (dtoAuthor.id) {
      // existing author — validate id exists and preserve imageUrl
      const existingAuthor = existingAuthorMap.get(dtoAuthor.id);
      if (!existingAuthor) {
        throw new AppError(`Author not found: ${dtoAuthor.id}`, 400);
      }
      return {
        id:         existingAuthor.id,
        name:       dtoAuthor.name,
        isMe:       dtoAuthor.isMe,
        profileUrl: dtoAuthor.profileUrl,
        imageUrl:   existingAuthor.imageUrl,  // preserved — never from client
      };
    } else {
      // new author — generate id, no imageUrl yet
      return {
        id:         uuidv4(),
        name:       dtoAuthor.name,
        isMe:       dtoAuthor.isMe,
        profileUrl: dtoAuthor.profileUrl,
      };
    }
  });
}

const getMergedInterviewers = (mediaContributionDto: UpdateMediaContributionDto, existingMediaContributionDoc: MediaContributionDocument) => {
  const existingInterviewerMap = new Map(
    existingMediaContributionDoc.interviewers?.map(a => [a.id, a])
  );

  return mediaContributionDto.interviewers?.map(dtoInterviewer => {
    if (dtoInterviewer.id) {
      // existing interviewer — validate id exists and preserve imageUrl
      const existingInterviewer = existingInterviewerMap.get(dtoInterviewer.id);
      if (!existingInterviewer) {
        throw new AppError(`Interviewer not found: ${dtoInterviewer.id}`, 400);
      }
      return {
        id:         existingInterviewer.id,
        name:       dtoInterviewer.name,
        profileUrl: dtoInterviewer.profileUrl,
        imageUrl:   existingInterviewer.imageUrl,  // preserved — never from client
      };
    } else {
      // new interviewer — generate id, no imageUrl yet
      return {
        id:         uuidv4(),
        name:       dtoInterviewer.name,
        profileUrl: dtoInterviewer.profileUrl,
      };
    }
  });
}

const getMergedOutlet = (mediaContributionDto: UpdateMediaContributionDto, existingMediaContributionDoc: MediaContributionDocument) => {
  // Field not included in the update payload at all — keep existing value
  if (mediaContributionDto.outlet === undefined) {
    return existingMediaContributionDoc.outlet;
  }

  // Explicitly sent as null — client wants to clear the outlet
  if (mediaContributionDto.outlet === null) {
    return undefined;
  }

  if (mediaContributionDto.outlet && !mediaContributionDto.outlet.name?.en?.trim()) {
    throw new AppError('Outlet name must have en locale.', 400);
  }

  // Outlet data provided — merge, preserving server-managed imageUrl
  return {
    name:     mediaContributionDto.outlet.name,
    webUrl:   mediaContributionDto.outlet.webUrl,
    imageUrl: existingMediaContributionDoc.outlet?.imageUrl,
  };
}

const getMergedPreviewImages = (mediaContributionDto: UpdateMediaContributionDto, existingMediaContributionDoc: MediaContributionDocument) => {
  if (!mediaContributionDto.previewImages)
    return existingMediaContributionDoc.previewImages ?? [];

  const existingImages = existingMediaContributionDoc.previewImages ?? [];

  const existingImageMap = new Map(
    existingImages.map(img => [img.id, img])
  );

  const submittedIds = mediaContributionDto.previewImages.map(img => img.id);
  const missingId     = submittedIds.find(id => !existingImageMap.has(id));
  if (missingId) {
    throw new AppError(`Preview image not found: ${missingId}`, 400);
  }

  if (submittedIds.length !== existingImages.length) {
    throw new AppError('Preview images update must include all existing images.', 400);
  }

  return mediaContributionDto.previewImages.map(dtoImg => {
    const existingImg = existingImageMap.get(dtoImg.id)!;
    return {
      id:           existingImg.id,
      url:          existingImg.url,
      displayOrder: dtoImg.displayOrder,
    };
  });
}

export const deleteMediaContribution = async (mediaContributionId: string, appUser?: AppUser | null): Promise<void> => {
  const mediaContributionDoc = await MediaContributionModel.findOne({ 
    _id: mediaContributionId,
    deleted: false,
  });
  if (!mediaContributionDoc) {
    throw new AppError(`Cannot find the media contribution with ID '${mediaContributionId}' or it is already deleted.`, 404);
  }

  const deletedSuffix = `DELETED-${uuidv4()}`;

  const updatedMediaContributionDoc = await MediaContributionModel.findByIdAndUpdate(
    mediaContributionId,
    {
      $set: {
        'title.en': mediaContributionDoc.title.en ? `${mediaContributionDoc.title.en}-${deletedSuffix}` : undefined,
        'title.si': mediaContributionDoc.title.si ? `${mediaContributionDoc.title.si}-${deletedSuffix}` : undefined,
        'path':     `${mediaContributionDoc.path}-${deletedSuffix}`,
        deleted:    true,
        updatedBy:  appUser ?? undefined,
      },
      $inc: { __v: 1 },
    },
    { new: true }
  );

  if (!updatedMediaContributionDoc) {
    throw new AppError('Failed to delete media contribution.', 500);
  }
  logger.info(`Media contribution deleted: ${mediaContributionId}`);
  await invalidateSummaryStatsCache();
  await invalidateMediaContributionListCache();
  await invalidateMediaContributionDetailCache(mediaContributionDoc.path); // original path, before the DELETED- suffix was applied
}

export const toggleMediaContributionActivation = async (mediaContributionId: string, mediaContributionDto: ActivationMediaContributionDto, appUser?: AppUser | null): Promise<MediaContribution> => {
  const mediaContributionDoc = await MediaContributionModel.findOne({ _id: mediaContributionId, deleted: false });

  if (!mediaContributionDoc) {
    throw new AppError(`Cannot find the media contribution with ID: ${mediaContributionId}.`, 404);
  }

  // cover image is required before a media contribution can be made active
  if (mediaContributionDto.status === DocumentStatus.ACTIVE && !mediaContributionDoc.coverImage) {
    throw new AppError('Cannot activate a media contribution without a cover image.', 400);
  }

  mediaContributionDoc.status    = mediaContributionDto.status;
  mediaContributionDoc.updatedBy = appUser ?? undefined;
  mediaContributionDoc.increment(); // Increment the version for optimistic concurrency control

  await mediaContributionDoc.save({ validateModifiedOnly: true });

  logger.info(`Media contribution status updated for ID: ${mediaContributionId}`);
  await invalidateMediaContributionDetailCache(mediaContributionDoc.path);
  await invalidateMediaContributionListCache();
  await invalidateSummaryStatsCache();
  return mapDocumentToMediaContribution(mediaContributionDoc);
}

export const uploadCoverImage = async (mediaContributionId: string, imageFile?: Express.Multer.File): Promise<MediaContribution> => {
  const mediaContributionDoc = await MediaContributionModel.findOne({ _id: mediaContributionId, deleted: false });
  if (!mediaContributionDoc) {
    throw new AppError(`Cannot find the book with ID: '${mediaContributionId}'.`, 404);
  }

  if (!imageFile) {
    throw new AppError('No cover image file provided.', 400);
  }

  const imageUrl = await uploadImageToCloudService(imageFile);
  if (!imageUrl) {
    throw new AppError('Failed to upload cover image. Please try again.', 500);
  }

  // Note: imgbb does not support image deletion via API
  // old cover image URL is simply overwritten
  mediaContributionDoc.coverImage = imageUrl;
  mediaContributionDoc.increment();
  await mediaContributionDoc.save({ validateModifiedOnly: true });

  logger.info(`Uploaded cover image for book ID: ${mediaContributionId}`);
  await invalidateMediaContributionDetailCache(mediaContributionDoc.path);
  await invalidateMediaContributionListCache();
  return mapDocumentToMediaContribution(mediaContributionDoc);
}

export const deleteCoverImage = async (mediaContributionId: string): Promise<MediaContribution> => {
  const mediaContributionDoc = await MediaContributionModel.findOne({ _id: mediaContributionId, deleted: false });
  if (!mediaContributionDoc) {
    throw new AppError(`Cannot find the media contribution with ID: '${mediaContributionId}'.`, 404);
  }

  if (!mediaContributionDoc.coverImage) {
    throw new AppError('This media contribution has no cover image to delete.', 400);
  }

  mediaContributionDoc.coverImage = undefined;
  mediaContributionDoc.status = DocumentStatus.INACTIVE; // Deactivate the media contribution if cover image is deleted
  mediaContributionDoc.increment();
  await mediaContributionDoc.save({ validateModifiedOnly: true });

  logger.info(`Deleted cover image for book ID: ${mediaContributionId}`);
  await invalidateMediaContributionDetailCache(mediaContributionDoc.path);
  await invalidateMediaContributionListCache();
  return mapDocumentToMediaContribution(mediaContributionDoc);
}

export const uploadAuthorImage = async (mediaContributionId: string, authorId: string, imageFile?: Express.Multer.File): Promise<MediaContribution> => {
  const mediaContributionDoc = await MediaContributionModel.findOne({ _id: mediaContributionId, deleted: false });
  if (!mediaContributionDoc) {
    throw new AppError(`Cannot find the media contribution with ID: '${mediaContributionId}'.`, 404);
  }
  if (!mediaContributionDoc.authors) {
    throw new AppError(`Media contribution with ID: '${mediaContributionId}' has no authors.`, 400);
  }

  console.log(`mc id: ${mediaContributionId}`);
  console.log(`author id: ${authorId}`);
  console.log(`authors: ${JSON.stringify(mediaContributionDoc.authors)}`);

  // find the author within the media contribution
  const authorIndex = mediaContributionDoc.authors.findIndex(a => a.id === authorId);
  if (authorIndex === -1) {
    throw new AppError(`Author: '${authorId}' not found for the media contribution ${mediaContributionId}.`, 404);
  }

  if (!imageFile) {
    throw new AppError('No author image file provided.', 400);
  }

  const imageUrl = await uploadImageToCloudService(imageFile);
  if (!imageUrl) {
    throw new AppError('Failed to upload author image. Please try again.', 500);
  }

  // Note: imgbb does not support image deletion via API
  // old cover image URL is simply overwritten
  mediaContributionDoc.authors[authorIndex].imageUrl = imageUrl;
  mediaContributionDoc.increment();
  await mediaContributionDoc.save({ validateModifiedOnly: true });

  logger.info(`Uploaded image for author ID: ${authorId} in book ID: ${mediaContributionId}`);
  return mapDocumentToMediaContribution(mediaContributionDoc);
}

export const deleteAuthorImage = async (mediaContributionId: string, authorId: string): Promise<MediaContribution> => {
  const mediaContributionDoc = await MediaContributionModel.findOne({ _id: mediaContributionId, deleted: false });
  if (!mediaContributionDoc) {
    throw new AppError(`Cannot find the book with ID: '${mediaContributionId}'.`, 404);
  }
  if (!mediaContributionDoc.authors) {
    throw new AppError(`Media contribution with ID: '${mediaContributionId}' has no authors.`, 400);
  }

  // find the author within the media contribution
  const authorIndex = mediaContributionDoc.authors.findIndex(a => a.id === authorId);
  if (authorIndex === -1) {
    throw new AppError(`Author: '${authorId}' not found for the book ${mediaContributionId}.`, 404);
  }

  if (!mediaContributionDoc.authors[authorIndex].imageUrl) {
    throw new AppError('This author has no image to delete.', 400);
  }

  // Note: imgbb does not support image deletion via API
  mediaContributionDoc.authors[authorIndex].imageUrl = undefined;
  mediaContributionDoc.increment();
  await mediaContributionDoc.save({ validateModifiedOnly: true });

  logger.info(`Deleted author image for author: ${authorId} in book: ${mediaContributionId}`);
  return mapDocumentToMediaContribution(mediaContributionDoc);
}

export const uploadPreviewImages = async (mediaContributionId: string, imageFiles?: Express.Multer.File[]): Promise<MediaContribution> => {
  const mediaContributionDoc = await MediaContributionModel.findOne({ _id: mediaContributionId, deleted: false });
  if (!mediaContributionDoc) throw new AppError(`Cannot find the media contribution with ID: '${mediaContributionId}'.`, 404);

  if (!imageFiles || imageFiles.length === 0) {
    throw new AppError('No preview image files provided.', 400);
  }

  const currentCount = mediaContributionDoc.previewImages?.length ?? 0;
  if (currentCount + imageFiles.length > MAX_MEDIA_CONTRIBUTION_PREVIEW_IMAGES) {
    throw new AppError(`Cannot exceed ${MAX_MEDIA_CONTRIBUTION_PREVIEW_IMAGES} preview images. Currently has ${currentCount}.`, 400);
  }

  // upload all files concurrently
  const uploadedUrls = await Promise.all(
    imageFiles.map(file => uploadImageToCloudService(file))
  );

  // map each uploaded URL to a BookPreviewImage sub-document
  const newImages: MediaContributionPreviewImage[] = uploadedUrls.map((url, index) => ({
    id: uuidv4(),
    url,
    displayOrder: currentCount + index,  // append after existing images
  }));

  mediaContributionDoc.previewImages = [...(mediaContributionDoc.previewImages ?? []), ...newImages];
  mediaContributionDoc.increment();
  await mediaContributionDoc.save({ validateModifiedOnly: true });

  logger.info(`Uploaded ${uploadedUrls.length} preview image(s) for media contribution ID: ${mediaContributionId}`);
  return mapDocumentToMediaContribution(mediaContributionDoc);
}

export const deletePreviewImage = async (mediaContributionId: string, previewImageId: string): Promise<MediaContribution> => {
  const mediaContributionDoc = await MediaContributionModel.findOne({ _id: mediaContributionId, deleted: false });
  if (!mediaContributionDoc) throw new AppError(`Cannot find the media contribution with ID: '${mediaContributionId}'.`, 404);

  const existingImages = mediaContributionDoc.previewImages ?? [];

  const imageExists = existingImages.some(img => img.id === previewImageId);
  if (!imageExists) {
    throw new AppError('Preview image not found for this media contribution.', 404);
  }

  mediaContributionDoc.previewImages = existingImages.filter(img => img.id !== previewImageId);
  mediaContributionDoc.increment();
  await mediaContributionDoc.save({ validateModifiedOnly: true });

  logger.info(`Deleted preview image for media contribution ID: ${mediaContributionId}`);
  return mapDocumentToMediaContribution(mediaContributionDoc);
}

export const reorderPreviewImages = async (mediaContributionId: string, dto: ReorderPreviewImagesDto): Promise<MediaContribution> => {
  const mediaContributionDoc = await MediaContributionModel.findOne({ _id: mediaContributionId, deleted: false });
  if (!mediaContributionDoc) throw new AppError(`Cannot find the media contribution with ID: '${mediaContributionId}'.`, 404);

  const existingImages = mediaContributionDoc.previewImages ?? [];

  // ensure submitted IDs exactly match existing ones — no additions or removals
  const existingIdSet  = new Set(existingImages.map(img => img.id));
  const submittedIdSet = new Set(dto.ids);

  const sameLength = existingIdSet.size === submittedIdSet.size;
  const sameIds    = [...submittedIdSet].every(id => existingIdSet.has(id));

  if (!sameLength || !sameIds) {
    throw new AppError('Reorder list must contain exactly the same IDs as existing preview images.', 400);
  }

  // rebuild array in submitted order with updated displayOrder
  mediaContributionDoc.previewImages = dto.ids.map((id, index) => {
    const img = existingImages.find(img => img.id === id)!;
    return { ...img, displayOrder: index };
  });

  mediaContributionDoc.increment();
  await mediaContributionDoc.save({ validateModifiedOnly: true });

  logger.info(`Reordered preview images for media contribution ID: ${mediaContributionId}`);
  return mapDocumentToMediaContribution(mediaContributionDoc);
}

export const uploadPdfFile = async (mediaContributionId: string, pdfFile?: Express.Multer.File): Promise<MediaContribution> => {
  const mediaContributionDoc = await MediaContributionModel.findOne({ _id: mediaContributionId, deleted: false });
  if (!mediaContributionDoc) {
    throw new AppError(`Cannot find the media contribution with ID: '${mediaContributionId}'.`, 404);
  }

  if (!pdfFile) {
    throw new AppError('No PDF file provided.', 400);
  }

  // delete old PDF from R2 before uploading new one
  if (mediaContributionDoc.pdfLink) {
    await deleteFileFromR2(mediaContributionDoc.pdfLink);
  }

  const pdfUrl = await uploadFileToR2(pdfFile, 'media-contributions/pdf-files');

  mediaContributionDoc.pdfLink = pdfUrl;
  mediaContributionDoc.increment();
  await mediaContributionDoc.save({ validateModifiedOnly: true });

  logger.info(`Uploaded PDF file for media contribution ID: ${mediaContributionId}`);
  return mapDocumentToMediaContribution(mediaContributionDoc);
}

export const deletePdfFile = async (mediaContributionId: string): Promise<MediaContribution> => {
  const mediaContributionDoc = await MediaContributionModel.findOne({ _id: mediaContributionId, deleted: false });
  if (!mediaContributionDoc) {
    throw new AppError(`Cannot find the media contribution with ID: '${mediaContributionId}'.`, 404);
  }

  if (!mediaContributionDoc.pdfLink) {
    throw new AppError('This media contribution has no PDF file to delete.', 400);
  }

  await deleteFileFromR2(mediaContributionDoc.pdfLink);

  mediaContributionDoc.pdfLink = undefined;
  mediaContributionDoc.increment();
  await mediaContributionDoc.save({ validateModifiedOnly: true });

  logger.info(`Deleted PDF teaser for media contribution ID: ${mediaContributionId}`);
  return mapDocumentToMediaContribution(mediaContributionDoc);
}

export const invalidateMediaContributionListCache = async (): Promise<void> => {
  const cache = getCacheStrategy();
  await cache.deleteByPrefix(MEDIA_CONTRIBUTION_LIST_CACHE_KEY_PREFIX);
}

export const getLocalizedMediaContributions = async (lang: string, page: number, size: number): Promise<{ items: LocalizedSummaryMediaContribution[], totalCount: number }> => {
  validatePaginationDetails(page, size);

  const locale = resolveLocale(lang);
  const cache = getCacheStrategy();
  const cacheKey = mediaContributionListCacheKey(locale, page, size);

  const cached = await cache.get<{ items: LocalizedSummaryMediaContribution[]; totalCount: number }>(cacheKey);
  if (cached) return cached;

  logger.info(`No cached media contribution list found for locale: ${lang}, hitting db to get media contributions list`);

  const [totalCount, mediaContributionDocs] = await Promise.all([
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
    items: mediaContributionDocs.map(doc => toLocalizedSummaryMediaContribution(doc, locale)),
    totalCount,
  };

  await cache.set(cacheKey, result, MEDIA_CONTRIBUTION_LIST_CACHE_TTL_SECONDS);
  return result;
}

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
    status:  DocumentStatus.ACTIVE,   // public only sees active media contributions
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
}

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
      isMe:        a.isMe,
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
      caption: pi.caption ? localizeField(pi.caption, locale) : undefined,
      displayOrder: pi.displayOrder,
    })),
    featured:      doc.featured,
  };
}

const invalidateMediaContributionDetailCache = async (path: string): Promise<void> => {
  const cache = getCacheStrategy();
  await Promise.all(
    SUPPORTED_LOCALES.map(locale => cache.delete(mediaContributionDetailCacheKey(path, locale)))
  );
}
