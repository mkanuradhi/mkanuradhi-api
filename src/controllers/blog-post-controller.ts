import { NextFunction, Request, Response } from "express";
import asyncErrorHandler from "../utils/async-error-handler";
import { CreateBlogPostTextEnDto, PublishBlogPostTextDto, UpdateBlogPostTextEnDto, UpdateBlogPostTextSiDto } from "../dtos/blog-post-dto";
import * as blogPostService from "../services/blog-post-service";
import { SearchParamsDto } from "../dtos/search-params-dto";
import { parseLangQueryParam } from "../utils/common-util";
import PaginatedResult from "../interfaces/i-paginated-result";
import BlogPost from "../interfaces/i-blog-post";

export const createBlogPostTextEn = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const {
    titleEn,
    summaryEn,
    contentEn,
    pageDescriptionEn,
    path,
    status,
    keywords,
    dateTime,
  } = req.body;

  const blogPostTextEnDto: CreateBlogPostTextEnDto = {
    titleEn,
    summaryEn,
    contentEn,
    pageDescriptionEn,
    path,
    status,
    keywords,
    dateTime,
  };
  const addedBlogPost = await blogPostService.createBlogPostTextEn(blogPostTextEnDto);
  res.status(201).json(addedBlogPost);
});

export const getBlogPosts = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 0;
  const size = Math.min(parseInt(req.query.size as string) || 10, 100);

  const { items, totalCount } = await blogPostService.getBlogPosts(page, size);
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / size) : 1;

  const result: PaginatedResult<BlogPost> = {
    items,
    pagination: {
      totalCount,
      totalPages,
      currentPage: page,
      currentPageSize: items.length,
    },
  };

  res.status(200).json(result);
});

export const getBlogPost = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const blogPostId = req.params.id;
  const blogPost = await blogPostService.getBlogPost(blogPostId);
  res.status(200).json(blogPost);
});

export const getBlogPostByPath = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const lang: string = parseLangQueryParam(req);
  const blogPostPath = req.params.path;
  const blogPostView = await blogPostService.getBlogPostByPath(lang, blogPostPath);
  res.status(200).json(blogPostView);
});

export const updateBlogPostTextEn = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const blogPostId = req.params.id;
  const {
    titleEn,
    summaryEn,
    contentEn,
    pageDescriptionEn,
    path,
    status,
    keywords,
    dateTime,
    v
  } = req.body;

  const blogPostTextDto: UpdateBlogPostTextEnDto = {
    titleEn,
    summaryEn,
    contentEn,
    pageDescriptionEn,
    path,
    status,
    keywords,
    dateTime,
    v
  };
  
  const updatedBlogPost = await blogPostService.updateBlogPostTextEn(blogPostId, blogPostTextDto);
  res.status(200).json(updatedBlogPost);
});

export const updateBlogPostTextSi = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const blogPostId = req.params.id;
  const {
    titleSi,
    summarySi,
    contentSi,
    pageDescriptionSi,
    v
  } = req.body;

  const blogPostTextDto: UpdateBlogPostTextSiDto = {
    titleSi,
    summarySi,
    contentSi,
    pageDescriptionSi,
    v
  };
  
  const updatedBlogPost = await blogPostService.updateBlogPostTextSi(blogPostId, blogPostTextDto);
  res.status(200).json(updatedBlogPost);
});

export const uploadPrimaryImage = asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
  const blogPostId = req.params.id;
  const updatedBlogPost = await blogPostService.uploadPrimaryImage(blogPostId, req.file);
  res.status(200).json(updatedBlogPost);
});

export const uploadImages = asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
  const blogPostId = req.params.id;
  const files: Express.Multer.File[] | undefined = Array.isArray(req.files)
    ? req.files
    : req.files && typeof req.files === "object"
    ? Object.values(req.files).flat()
    : undefined; 
  const updatedBlogPost = await blogPostService.uploadImages(blogPostId, files);
  res.status(200).json(updatedBlogPost);
});

export const publishBlogPost = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const blogPostId = req.params.id;
  const {
    published,
  } = req.body;

  const blogPostTextDto: PublishBlogPostTextDto = {
    published,
  };
  
  const updatedBlogPost = await blogPostService.publishBlogPost(blogPostId, blogPostTextDto);
  res.status(200).json(updatedBlogPost);
});

export const deleteBlogPost = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const blogPostId = req.params.id;
  await blogPostService.deleteBlogPost(blogPostId);
  res.status(204).json();
});

export const searchBlogPosts = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const searchParams: SearchParamsDto = parseSearchParams(req);
  const lang: string = parseLangQueryParam(req);
  const { blogPostViews, totalCount } = await blogPostService.searchBlogPosts(lang, searchParams);
  
  const message = `${totalCount} result${totalCount !== 1 ? 's' : ''} found for '${searchParams.query}'`;

  res.status(200).json({
    message,
    data: blogPostViews,
    pagination: {
      page: searchParams.page,
      size: searchParams.size,
      pageCount: blogPostViews.length,
      totalCount,
    },
  });
});

const parseSearchParams = (req: Request): SearchParamsDto => {
  const parsePublished = (value: string | undefined): boolean | undefined => {
    if (value === undefined) return undefined;
    const truthyValues = ["1", "true", "t", "yes", "y"];
    const falsyValues = ["0", "false", "f", "no", "n"];
    const normalizedValue = value.trim().toLowerCase();
    if (truthyValues.includes(normalizedValue)) return true;
    if (falsyValues.includes(normalizedValue)) return false;
    return undefined;
  };

  return {
    query: (req.query.q as string) || "",
    page: parseInt(req.query.page as string) || 0,
    size: Math.min(parseInt(req.query.size as string) || 20, 100),
    published: parsePublished(req.query.published as string),
    sort: req.query.sort as string, // Expected: "latest", "oldest"
  };
};
