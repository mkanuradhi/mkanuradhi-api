import { NextFunction, Request, Response } from "express";
import asyncErrorHandler from "../utils/async-error-handler";
import { ActivationCourseDto, CreateCourseEnDto, UpdateCourseEnDto, UpdateCourseSiDto } from "../dtos/course-dto";
import * as courseService from "../services/course-service";
import PaginatedResult from "../interfaces/i-paginated-result";
import Course from "../interfaces/i-course";
import { SearchParamsDto } from "../dtos/search-params-dto";
import CourseView from "../interfaces/i-course-view";
import { parseLangQueryParam, parseSearchParams } from "../utils/common-util";

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

export const getCourse = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const courseId = req.params.id;
  const course = await courseService.getCourse(courseId);
  res.status(200).json(course);
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
    v
  };
  
  const updatedCourse = await courseService.updateCourseEn(courseId, courseDto);
  res.status(200).json(updatedCourse);
});

export const updateCourseSi = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const courseId = req.params.id;
  const {
    titleSi,
    subtitleSi,
    descriptionSi,
    locationSi,
    v
  } = req.body;

  const courseDto: UpdateCourseSiDto = {
    titleSi,
    subtitleSi,
    descriptionSi,
    locationSi,
    v
  };
  
  const updatedCourse = await courseService.updateCourseSi(courseId, courseDto);
  res.status(200).json(updatedCourse);
});

export const toggleCourseActivation = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const courseId = req.params.id;
  const {
    status,
  } = req.body;

  const courseDto: ActivationCourseDto = {
    status,
  };
  
  const updatedCourse = await courseService.toggleCourseActivation(courseId, courseDto);
  res.status(200).json(updatedCourse);
});

export const deleteCourse = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const courseId = req.params.id;
  await courseService.deleteCourse(courseId);
  res.status(204).json();
});

export const searchCourses = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const searchParams: SearchParamsDto = parseSearchParams(req);
  const lang: string = parseLangQueryParam(req);
  const { courseViews, totalCount } = await courseService.searchCourses(lang, searchParams);
  
  const page = searchParams.page || 0;
  const size = searchParams.size || 200;

  const message = `${totalCount} result${totalCount !== 1 ? 's' : ''} found for '${searchParams.query}'`;
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / size) : 1;

  const result: PaginatedResult<CourseView> = {
    message,
    items: courseViews,
    pagination: {
      totalCount,
      totalPages,
      currentPage: page,
      currentPageSize: courseViews.length,
    },
  };

  res.status(200).json(result);
});
