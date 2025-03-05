import logger from "../config/logger-config";
import { CreateCourseEnDto, UpdateCourseEnDto } from "../dtos/course-dto";
import DocumentStatus from "../enums/document-status";
import Course from "../interfaces/i-course";
import CourseModel from "../models/course-model";
import AppError from "../errors/app-error";
import { mapDocumentsToCourses, mapDocumentToCourse } from "../mappers/course-mapper";
import { validatePaginationDetails } from "../validators/common-validator";

export const createCourseEn = async (courseDto: CreateCourseEnDto): Promise<Course> => {
  const existingCourseDoc = await CourseModel.findOne({
    year: courseDto.year,
    code: courseDto.code,
    titleEn: courseDto.titleEn.trim(),
    locationEn: courseDto.locationEn.trim(),
    deleted: false
  });
  if (existingCourseDoc) {
      throw new AppError(`Existing course found for the year: ${courseDto.year}, code: ${courseDto.code}, title: ${courseDto.titleEn} and location: ${courseDto.locationEn}`, 400);
  }

  const courseDoc = await CourseModel.create({
    year: courseDto.year,
    code: courseDto.code,
    credits: courseDto.credits,
    titleEn: courseDto.titleEn,
    subtitleEn: courseDto.subtitleEn,
    descriptionEn: courseDto.descriptionEn,
    locationEn: courseDto.locationEn,
    path: courseDto.path,
    quizzes: [],
    status: courseDto.status || DocumentStatus.ACTIVE,
  });

  logger.info(`Course created for ${courseDto.titleEn}`);
  return mapDocumentToCourse(courseDoc);
}

export const getCourses = async (page: number, size: number): Promise<{ items: Course[], totalCount: number }> => {
  validatePaginationDetails(page, size);
  const totalCount = await CourseModel.countDocuments({ deleted: false });
  const courseDocs = await CourseModel
    .find(
      { deleted: false  }, 
      {
        year: 1,
        code: 1,
        credits: 1,
        titleEn: 1, 
        subtitleEn: 1,
        titleSi: 1,
        subtitleSi: 1,
        path: 1,
      })
    .sort({ year: -1 })
    .skip(page * size)
    .limit(size);

  return {
    items: mapDocumentsToCourses(courseDocs),
    totalCount
  };
}

export const updateCourseEn = async (courseId: string, courseDto: UpdateCourseEnDto): Promise<Course> => {
  const existingCourseDoc = await CourseModel.findOne({
    _id: courseId,
    deleted: false,
  });
  if (!existingCourseDoc) {
      throw new AppError(`Cannot find the course with ID: ${courseId}. Unable to update the course.`, 400);
  }
  if (existingCourseDoc.__v !== courseDto.v) {
    throw new AppError(`Course has been modified by another process. Please refresh and try again.`, 409);
  }

  const existingCourseDocsWithTitle = await CourseModel.find({
    _id: { $ne: courseId },
    titleEn: courseDto.titleEn.trim(),
    deleted: false,
  });
  if (existingCourseDocsWithTitle && existingCourseDocsWithTitle.length > 0) {
    throw new AppError(`Existing course found for the title in En: ${courseDto.titleEn}`, 400);
  }

  const updatedCourseDoc = await CourseModel.findByIdAndUpdate(
    courseId,
    { 
      $set: {
        year: courseDto.year,
        code: courseDto.code,
        credits: courseDto.credits,
        titleEn: courseDto.titleEn,
        descriptinEn: courseDto.descriptionEn,
        locationEn: courseDto.locationEn,
        path: courseDto.path,
        status: courseDto.status || DocumentStatus.ACTIVE,
      },
      $inc: { __v: 1 }
    },
    { new: true }
  );

  if (!updatedCourseDoc) {
      throw new AppError('Failed to update course document.', 500);
  }

  logger.info(`course updated for ID: ${courseId}`);
  return mapDocumentToCourse(updatedCourseDoc);
}
