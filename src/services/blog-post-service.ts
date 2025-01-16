import logger from "../config/logger-config";
import { CreateBlogPostTextDto, UpdateBlogPostTextDto } from "../dtos/blog-post-dto";
import DocumentStatus from "../enums/document-status";
import BlogPost from "../interfaces/i-blog-post";
import BlogPostModel from "../models/blog-post-model";
import AppError from "../errors/app-error";
import { mapDocumentToBlogPost, mapDocumentsToBlogPosts } from "../mappers/blog-post-mapper";
import { validatePaginationDetails } from "../validators/common-validator";
import { v4 as uuidv4 } from 'uuid';
import { uploadImageToCloudService } from "../utils/common-util";

const createBlogPostText = async (blogPostDto: CreateBlogPostTextDto): Promise<BlogPost> => {
  const existingProductDoc = await BlogPostModel.findOne({
    $or: [
      { titleEn: blogPostDto.titleEn.trim() },
      { titleSi: blogPostDto.titleSi.trim() }
    ],
    deleted: false
  });
  if (existingProductDoc) {
      throw new AppError(`Existing blog post found for the title: ${blogPostDto.titleEn} OR ${blogPostDto.titleSi}`, 400);
  }

  const blogPostDoc = await BlogPostModel.create({ 
    titleEn: blogPostDto.titleEn,
    summaryEn: blogPostDto.summaryEn,
    contentEn: blogPostDto.contentEn,
    pageDescriptionEn: blogPostDto.pageDescriptionEn,
    titleSi: blogPostDto.titleSi,
    summarySi: blogPostDto.summarySi,
    contentSi: blogPostDto.contentSi,
    pageDescriptionSi: blogPostDto.pageDescriptionSi,
    path: blogPostDto.path,
    status: blogPostDto.status || DocumentStatus.Active,
    keywords: blogPostDto.keywords || [],
    dateTime: blogPostDto.dateTime || new Date(),
    published: blogPostDto.published,
    deleted: blogPostDto.deleted,
  });

  logger.info(`Blog Post created for ${blogPostDto.titleEn}`);
  return mapDocumentToBlogPost(blogPostDoc);
}

const getBlogPosts = async (page: number, size: number): Promise<BlogPost[]> => {
  validatePaginationDetails(page, size);
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
      })
    .sort({ dateTime: 1 })
    .skip(page * size)
    .limit(size);

  return mapDocumentsToBlogPosts(blogPostDocs);
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
      published: 1,
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

const getBlogPostByPath = async (blogPostPath: string): Promise<BlogPost> => {
  const blogPostDoc = await BlogPostModel.findOne(
    { path: blogPostPath }, 
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
      published: 1,
      deleted: 1,
      createdAt: 1,
      updatedAt: 1,
      __v: 1
    }
  );

  if (blogPostDoc) {
    return mapDocumentToBlogPost(blogPostDoc);
  } else {
    throw new AppError(`Blog post cannot be found for path: ${blogPostPath}`, 400);
  }
}

const updateBlogPostText = async (blogPostId: string, blogPostDto: UpdateBlogPostTextDto): Promise<BlogPost> => {
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

  const updatedBlogPostDoc = await BlogPostModel.findByIdAndUpdate(
    blogPostId,
    { 
      $set: {
        titleEn: blogPostDto.titleEn,
        summaryEn: blogPostDto.summaryEn,
        contentEn: blogPostDto.contentEn,
        pageDescriptionEn: blogPostDto.pageDescriptionEn,
        titleSi: blogPostDto.titleSi,
        summarySi: blogPostDto.summarySi,
        contentSi: blogPostDto.contentSi,
        pageDescriptionSi: blogPostDto.pageDescriptionSi,
        path: blogPostDto.path,
        status: blogPostDto.status || DocumentStatus.Active,
        keywords: blogPostDto.keywords || [],
        dateTime: blogPostDto.dateTime || new Date(),
        published: blogPostDto.published,
        deleted: blogPostDto.deleted,
      },
      $inc: { __v: 1 }
    },
    { new: true }
  );

  if (!updatedBlogPostDoc) {
      throw new AppError('Failed to update blog post document.', 500);
  }

  logger.info(`Blog post updated for ID: ${blogPostId}`);
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

  const imageUrl = await uploadImageToCloudService(imageFile);
  if (!imageUrl) {
    throw new AppError("Failed to upload the primary image. Please try again.", 500);
  }

  blogPostDoc.set({
    primaryImage: imageUrl,
  });
  blogPostDoc.increment();
  await blogPostDoc.save();

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

  return mapDocumentToBlogPost(blogPostDoc);
}

const deleteBlogPost = async (blogPostId: string): Promise<void> => {
  const blogPostDoc = await BlogPostModel.findOne({ 
    _id: blogPostId,
    deleted: false,
  });
  if (!blogPostDoc) {
    throw new AppError(`Cannot find the blog post with ID '${blogPostId}' or it is already deleted.`, 404);
  }

  const deletedTitleEn = `${blogPostDoc.titleEn}-${DocumentStatus.Deleted}-${uuidv4()}`;
  const deletedTitleSi = `${blogPostDoc.titleSi}-${DocumentStatus.Deleted}-${uuidv4()}`;

  const updatedBlogPostDoc = await BlogPostModel.findByIdAndUpdate(
    blogPostId,
    {
      $set: {
        titleEn: deletedTitleEn,
        titleSi: deletedTitleSi,
        deleted: true,
        status: DocumentStatus.Deleted,
      },
      $inc: { __v: 1 }
    },
    { new: true }
  );
  if (!updatedBlogPostDoc) {
    throw new AppError('Failed to delete blog post document.', 500);
  }
}

export { createBlogPostText, getBlogPosts, getBlogPost, getBlogPostByPath, updateBlogPostText, uploadPrimaryImage, uploadImages, deleteBlogPost };
