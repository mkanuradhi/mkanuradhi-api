import logger from "../config/logger-config";
import { CreateBlogPostTextEnDto, UpdateBlogPostTextSiDto, UpdateBlogPostTextEnDto, ActivationBlogPostDto } from "../dtos/blog-post-dto";
import BlogPost from "../interfaces/i-blog-post";
import BlogPostView from "../interfaces/i-blog-post-view";
import BlogPostModel from "../models/blog-post-model";
import AppError from "../errors/app-error";
import { mapDocumentToBlogPost, mapDocumentToBlogPostView, mapDocumentsToBlogPostViews, mapDocumentsToBlogPosts } from "../mappers/blog-post-mapper";
import { validatePaginationDetails } from "../validators/common-validator";
import { v4 as uuidv4 } from 'uuid';
import { buildSearchFilter, capitalizeLang, resolveLocale, uploadImageToCloudService } from "../utils/common-util";
import { SearchParamsDto } from "../dtos/search-params-dto";
import BlogPostDocument from "../documents/blog-post-document";
import { deleteFileFromR2, uploadFileToR2 } from "../utils/r2-util";
import { BLOG_POST_LIST_CACHE_KEY_PREFIX, R2_PATHS } from "../constants/common-vars";
import { invalidateSummaryStatsCache } from "./stat-service";
import { getCacheStrategy } from "../cache/cache-factory";
import { Locale, SUPPORTED_LOCALES } from "../types/locale.types";
import DocumentStatus from "../enums/document-status";
import { createHash } from "crypto";

const BLOG_POST_LIST_CACHE_TTL_SECONDS = 60 * 60 * 12; // 12h
const BLOG_POST_DETAIL_CACHE_TTL_SECONDS = 60 * 60 * 12; // 12h

const createBlogPostTextEn = async (blogPostDto: CreateBlogPostTextEnDto): Promise<BlogPost> => {
  const existingBlogPostDoc = await BlogPostModel.findOne({
    titleEn: blogPostDto.titleEn.trim(),
    deleted: false
  });
  if (existingBlogPostDoc) {
      throw new AppError(`Existing blog post found for the title: ${blogPostDto.titleEn}`, 400);
  }

  const blogPostDoc = await BlogPostModel.create({ 
    titleEn: blogPostDto.titleEn,
    summaryEn: blogPostDto.summaryEn,
    contentEn: blogPostDto.contentEn,
    pageDescriptionEn: blogPostDto.pageDescriptionEn,
    path: blogPostDto.path,
    keywords: blogPostDto.keywords || [],
    dateTime: blogPostDto.dateTime || new Date(),
  });

  logger.info(`Blog Post created for ${blogPostDto.titleEn}`);
  await invalidateSummaryStatsCache();
  await invalidateBlogPostListCache();
  return mapDocumentToBlogPost(blogPostDoc);
}

const getBlogPosts = async (page: number, size: number): Promise<{ items: BlogPost[], totalCount: number }> => {
  validatePaginationDetails(page, size);
  const totalCount = await BlogPostModel.countDocuments({ deleted: false });
  const blogPostDocs = await BlogPostModel
    .find(
      { deleted: false  }, 
      { 
        titleEn: 1, 
        summaryEn: 1,
        titleSi: 1,
        summarySi: 1,
        path: 1,
        primaryImage: 1,
        dateTime: 1,
        status: 1,
      })
    .sort({ dateTime: -1 })
    .skip(page * size)
    .limit(size);

  return {
    items: mapDocumentsToBlogPosts(blogPostDocs),
    totalCount
  };
}

const getBlogPost = async (blogPostId: string): Promise<BlogPost> => {
  const blogPostDoc = await BlogPostModel.findById(
    blogPostId, 
    { 
      titleEn: 1,
      summaryEn: 1,
      contentEn: 1,
      pageDescriptionEn: 1,
      titleSi: 1,
      summarySi: 1,
      contentSi: 1,
      pageDescriptionSi: 1,
      primaryImage: 1,
      images: 1,
      path: 1,
      status: 1,
      keywords: 1,
      dateTime: 1,
      deleted: 1,
      createdAt: 1,
      updatedAt: 1,
      __v: 1
    }
  );

  if (blogPostDoc) {
    return mapDocumentToBlogPost(blogPostDoc);
  } else {
    throw new AppError(`Blog post cannot be found for id: ${blogPostId}`, 400);
  }
}

const getBlogPostByPath = async (lang: string, blogPostPath: string): Promise<BlogPostView> => {
  const locale = resolveLocale(lang);
  const cache = getCacheStrategy();
  const cacheKey = blogPostDetailCacheKey(blogPostPath.trim(), locale);

  const cached = await cache.get<BlogPostView>(cacheKey);
  if (cached) return cached;

  logger.info(`No cached blog post view found for path: ${blogPostPath}, hitting db to get blog post view`);

  const commonFields = {
    primaryImage: 1,
    images: 1,
    path: 1,
    status: 1,
    keywords: 1,
    dateTime: 1,
    deleted: 1,
    createdAt: 1,
    updatedAt: 1,
    __v: 1,
  };
  const langFields = {
    [`title${capitalizeLang(lang)}`]: 1,
    [`summary${capitalizeLang(lang)}`]: 1,
    [`content${capitalizeLang(lang)}`]: 1,
    [`pageDescription${capitalizeLang(lang)}`]: 1,
  };
  const projection = { ...commonFields, ...langFields };

  const blogPostDoc = await BlogPostModel.findOne(
    { path: blogPostPath },
    projection
  ) as BlogPostDocument & Record<string, any>;

  if (!blogPostDoc) {
    throw new AppError(`Blog post cannot be found for path: ${blogPostPath}`, 404);
  }

  const result = mapDocumentToBlogPostView(lang, blogPostDoc);
  await cache.set(cacheKey, result, BLOG_POST_DETAIL_CACHE_TTL_SECONDS);

  logger.info(`Blog post view fetched by path: ${blogPostPath}`);
  return result;
}

const updateBlogPostTextEn = async (blogPostId: string, blogPostDto: UpdateBlogPostTextEnDto): Promise<BlogPost> => {
  const existingBlogPostDoc = await BlogPostModel.findOne({
    _id: blogPostId,
    deleted: false,
  });
  if (!existingBlogPostDoc) {
      throw new AppError(`Cannot find the blog post with ID: ${blogPostId}. Unable to update the blog post.`, 400);
  }
  if (existingBlogPostDoc.__v !== blogPostDto.v) {
    throw new AppError(`Blog post has been modified by another process. Please refresh and try again.`, 409);
  }

  const existingBlogPostDocsWithTitle = await BlogPostModel.find({
    _id: { $ne: blogPostId },
    titleEn: blogPostDto.titleEn.trim(),
    deleted: false,
  });
  if (existingBlogPostDocsWithTitle && existingBlogPostDocsWithTitle.length > 0) {
    throw new AppError(`Existing blog post found for the title in En: ${blogPostDto.titleEn}`, 400);
  }

  const updatedBlogPostDoc = await BlogPostModel.findByIdAndUpdate(
    blogPostId,
    { 
      $set: {
        titleEn: blogPostDto.titleEn,
        summaryEn: blogPostDto.summaryEn,
        contentEn: blogPostDto.contentEn,
        pageDescriptionEn: blogPostDto.pageDescriptionEn,
        path: blogPostDto.path,
        keywords: blogPostDto.keywords || [],
        dateTime: blogPostDto.dateTime || new Date(),
      },
      $inc: { __v: 1 }
    },
    { new: true }
  );

  if (!updatedBlogPostDoc) {
      throw new AppError('Failed to update blog post document.', 500);
  }

  logger.info(`English details updated for blog post ID: ${blogPostId}`);
  await invalidateBlogPostDetailCache(updatedBlogPostDoc.path);
  await invalidateBlogPostListCache();
  return mapDocumentToBlogPost(updatedBlogPostDoc);
}

const updateBlogPostTextSi = async (blogPostId: string, blogPostDto: UpdateBlogPostTextSiDto): Promise<BlogPost> => {
  const existingBlogPostDoc = await BlogPostModel.findOne({
    _id: blogPostId,
    deleted: false,
  });
  if (!existingBlogPostDoc) {
      throw new AppError(`Cannot find the blog post with ID: ${blogPostId}. Unable to update the blog post.`, 400);
  }
  if (existingBlogPostDoc.__v !== blogPostDto.v) {
    throw new AppError(`Blog post has been modified by another process. Please refresh and try again.`, 409);
  }

  const existingBlogPostDocsWithTitle = await BlogPostModel.find({
    _id: { $ne: blogPostId },
    titleSi: blogPostDto.titleSi.trim(),
    deleted: false,
  });
  if (existingBlogPostDocsWithTitle && existingBlogPostDocsWithTitle.length > 0) {
    throw new AppError(`Existing blog post found for the title in Si: ${blogPostDto.titleSi}`, 400);
  }

  const updatedBlogPostDoc = await BlogPostModel.findByIdAndUpdate(
    blogPostId,
    { 
      $set: {
        titleSi: blogPostDto.titleSi,
        summarySi: blogPostDto.summarySi,
        contentSi: blogPostDto.contentSi,
        pageDescriptionSi: blogPostDto.pageDescriptionSi,
      },
      $inc: { __v: 1 }
    },
    { new: true }
  );

  if (!updatedBlogPostDoc) {
    throw new AppError('Failed to update blog post document.', 500);
  }

  logger.info(`Sinhala details updated for blog post ID: ${blogPostId}`);
  await invalidateBlogPostDetailCache(updatedBlogPostDoc.path);
  await invalidateBlogPostListCache();
  return mapDocumentToBlogPost(updatedBlogPostDoc);
}

const uploadPrimaryImage = async (blogPostId: string, imageFile?: Express.Multer.File): Promise<BlogPost> => {
  const blogPostDoc = await BlogPostModel.findOne({
    _id: blogPostId,
    deleted: false,
  });
  if (!blogPostDoc) {
    throw new AppError(`Cannot find blog post with ID '${blogPostId}'`, 404);
  }
  if (!imageFile) {
    throw new AppError('No primary image file provided.', 400);
  }

  // delete old image from R2 before uploading new one
  if (blogPostDoc.primaryImage) {
    await deleteFileFromR2(blogPostDoc.primaryImage);
  }

  const imageUrl = await uploadFileToR2(imageFile, R2_PATHS.BLOG_POSTS_IMAGES);
  if (!imageUrl) {
    throw new AppError("Failed to upload the primary image. Please try again.", 500);
  }

  blogPostDoc.set({
    primaryImage: imageUrl,
  });
  blogPostDoc.increment();
  await blogPostDoc.save();

  logger.info(`Uploaded primary image for blog post ID: ${blogPostId}`);
  await invalidateBlogPostDetailCache(blogPostDoc.path);
  await invalidateBlogPostListCache();
  return mapDocumentToBlogPost(blogPostDoc);
}

const uploadImages = async (blogPostId: string, imageFiles?: Express.Multer.File[]): Promise<BlogPost> => {
  const blogPostDoc = await BlogPostModel.findOne({
    _id: blogPostId,
    deleted: false,
  });
  if (!blogPostDoc) {
    throw new AppError(`Cannot find blog post with ID '${blogPostId}'`, 404);
  }
  if (!imageFiles || imageFiles.length === 0) {
    throw new AppError('No image files provided.', 400);
  }

  const imageUrls = await Promise.all(
    imageFiles.map(async (file) => {
      return await uploadImageToCloudService(file);
    })
  );
  if (!imageUrls || imageUrls.length === 0) {
    throw new AppError("Failed to upload the images. Please try again.", 500);
  }

  blogPostDoc.images = imageUrls;
  blogPostDoc.increment();
  await blogPostDoc.save();

  logger.info(`Uploaded images for blog post ID: ${blogPostId}`);
  await invalidateBlogPostDetailCache(blogPostDoc.path);
  return mapDocumentToBlogPost(blogPostDoc);
}

const toggleBlogPostActivation = async (blogPostId: string, blogPostDto: ActivationBlogPostDto): Promise<BlogPost> => {
  const existingBlogPostDoc = await BlogPostModel.findOne({
    _id: blogPostId,
    deleted: false,
  });
  if (!existingBlogPostDoc) {
      throw new AppError(`Cannot find the blog post with ID: ${blogPostId}. Unable to update the blog post.`, 400);
  }

  if (
    !existingBlogPostDoc.titleSi?.trim() || 
    !existingBlogPostDoc.summarySi?.trim() || 
    !existingBlogPostDoc.contentSi?.trim() || 
    !existingBlogPostDoc.pageDescriptionSi?.trim()
  ) {
    throw new AppError("Missing or empty required fields in Sinhala: Either the title, summary, content, or page description is missing.", 400);
  }

  const updatedBlogPostDoc = await BlogPostModel.findByIdAndUpdate(
    blogPostId,
    { 
      $set: {
        status: blogPostDto.status,
      },
      $inc: { __v: 1 }
    },
    { new: true }
  );

  if (!updatedBlogPostDoc) {
      throw new AppError('Failed to update blog post document.', 500);
  }

  logger.info(`Updated status for blog post ID: ${blogPostId}`);
  await invalidateSummaryStatsCache();
  await invalidateBlogPostListCache();
  await invalidateBlogPostDetailCache(updatedBlogPostDoc.path);
  return mapDocumentToBlogPost(updatedBlogPostDoc);
}

const deleteBlogPost = async (blogPostId: string): Promise<void> => {
  const blogPostDoc = await BlogPostModel.findOne({ 
    _id: blogPostId,
    deleted: false,
  });
  if (!blogPostDoc) {
    throw new AppError(`Cannot find the blog post with ID '${blogPostId}' or it is already deleted.`, 404);
  }

  const deletedTitleEn = `${blogPostDoc.titleEn}-DELETED-${uuidv4()}`;
  const deletedTitleSi = `${blogPostDoc.titleSi}-DELETED-${uuidv4()}`;

  const updatedBlogPostDoc = await BlogPostModel.findByIdAndUpdate(
    blogPostId,
    {
      $set: {
        titleEn: deletedTitleEn,
        titleSi: deletedTitleSi,
        deleted: true,
      },
      $inc: { __v: 1 }
    },
    { new: true }
  );

  if (!updatedBlogPostDoc) {
    throw new AppError('Failed to delete blog post document.', 500);
  } else {
    await invalidateSummaryStatsCache();
    await invalidateBlogPostListCache();
    await invalidateBlogPostDetailCache(updatedBlogPostDoc.path);
    logger.info(`Blog post deleted for ID: ${blogPostId}`);
  }
}

const searchBlogPosts = async (lang: string, searchParams: SearchParamsDto): Promise<{ blogPostViews: BlogPostView[]; totalCount: number; }> => {
  const {page = 0, size = 10, sort, query, status} = searchParams;
  
  validatePaginationDetails(page, size);

  const cache = getCacheStrategy();
  const cacheKey = blogPostListCacheKey(page, size, sort, query, status);

  const cached = await cache.get<{ blogPostViews: BlogPostView[]; totalCount: number }>(cacheKey);
  if (cached) return cached;

  logger.info(`No cached blog post view list found, hitting db to get blog post view list`);

  const searchFilter = buildSearchFilter(searchParams);
  const sortOptions = getSortOptions(sort);

  const commonFields = {
    path: 1,
    primaryImage: 1,
    dateTime: 1,
    status: 1,
  };

  const langFields = {
    [`title${capitalizeLang(lang)}`]: 1,
    [`summary${capitalizeLang(lang)}`]: 1,
  };

  const projection = { ...commonFields, ...langFields };
  
  const [blogPostDocs, totalCount] = await Promise.all([
    // Fetch paginated blog posts
    BlogPostModel.find(searchFilter, projection)
      .sort(sortOptions)
      .skip(page * size)
      .limit(size),
    
    // Count total documents for the query
    BlogPostModel.countDocuments(searchFilter),
  ]);

  const result = {
    blogPostViews: mapDocumentsToBlogPostViews(lang, blogPostDocs),
    totalCount,
  };

  await cache.set(cacheKey, result, BLOG_POST_LIST_CACHE_TTL_SECONDS);
  return result;
}

const getSortOptions = (sort?: string): Record<string, 1 | -1> => {
  const defaultSort: Record<string, 1 | -1> = { dateTime: -1 }; // Default to newest first
  if (!sort) {
    return defaultSort;
  }

  switch (sort) {
    case "latest": return { dateTime: -1 };
    case "oldest": return { dateTime: 1 };
    default: return defaultSort;
  }
};

const invalidateBlogPostListCache = async (): Promise<void> => {
  const cache = getCacheStrategy();
  await cache.deleteByPrefix(BLOG_POST_LIST_CACHE_KEY_PREFIX);
}

const blogPostListCacheKey = (page: number, size: number, sort?: string, query?: string, status?: DocumentStatus): string => {
  const normalizedQuery = query?.trim().toLowerCase();

  const parts = [
    BLOG_POST_LIST_CACHE_KEY_PREFIX,
    `p${page}`,
    `s${size}`,
    `sort=${sort ?? "default"}`,
    `status=${status ?? "all"}`,
    `q=${normalizedQuery ? hashQuery(normalizedQuery) : "none"}`,
  ];

  return parts.join(":");
}

const hashQuery = (query: string): string =>
  createHash("sha1").update(query).digest("hex").slice(0, 16);

const blogPostDetailCacheKey = (path: string, locale: Locale) => `blog-post:detail:${locale}:${path}`;

const invalidateBlogPostDetailCache = async (path: string): Promise<void> => {
  const cache = getCacheStrategy();
  await Promise.all(
    SUPPORTED_LOCALES.map(locale => cache.delete(blogPostDetailCacheKey(path, locale)))
  );
}

export {
  createBlogPostTextEn,
  getBlogPosts,
  getBlogPost,
  getBlogPostByPath,
  updateBlogPostTextEn,
  updateBlogPostTextSi,
  uploadPrimaryImage,
  uploadImages,
  toggleBlogPostActivation,
  deleteBlogPost,
  searchBlogPosts,
};
