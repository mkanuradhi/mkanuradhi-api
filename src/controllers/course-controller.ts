import { NextFunction, Request, Response } from "express";
import asyncErrorHandler from "../utils/async-error-handler";
import { CreateCourseEnDto, UpdateCourseEnDto } from "../dtos/course-dto";
import * as courseService from "../services/course-service";
import PaginatedResult from "../interfaces/i-paginated-result";
import Course from "../interfaces/i-course";

export const createCourseEn = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const {
    year,
    code,
    credits,
    titleEn,
    subtitleEn,
    descriptionEn,
    locationEn,
    path,
    status
  } = req.body;

  const courseEnDto: CreateCourseEnDto = {
    year,
    code,
    credits,
    titleEn,
    subtitleEn,
    descriptionEn,
    locationEn,
    path,
    status
  };
  const addedCourse = await courseService.createCourseEn(courseEnDto);
  res.status(201).json(addedCourse);
});

export const getCourses = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 0;
  const size = Math.min(parseInt(req.query.size as string) || 10, 200);

  const { items, totalCount } = await courseService.getCourses(page, size);
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / size) : 1;

  const result: PaginatedResult<Course> = {
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

export const updateCourseEn = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const courseId = req.params.id;
  const {
    year,
    code,
    credits,
    titleEn,
    subtitleEn,
    descriptionEn,
    locationEn,
    path,
    status,
    v
  } = req.body;

  const courseDto: UpdateCourseEnDto = {
    year,
    code,
    credits,
    titleEn,
    subtitleEn,
    descriptionEn,
    locationEn,
    path,
    status,
    v
  };
  
  const updatedCourse = await courseService.updateCourseEn(courseId, courseDto);
  res.status(200).json(updatedCourse);
});
