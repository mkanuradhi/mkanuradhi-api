import logger from "../config/logger-config";
import { CreateCourseEnDto } from "../dtos/course-dto";
import DocumentStatus from "../enums/document-status";
import Course from "../interfaces/i-course";
import CourseModel from "../models/course-model";
import AppError from "../errors/app-error";
import { mapDocumentToCourse } from "../mappers/course-mapper";

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