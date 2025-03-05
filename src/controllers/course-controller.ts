import { NextFunction, Request, Response } from "express";
import asyncErrorHandler from "../utils/async-error-handler";
import { CreateCourseEnDto } from "../dtos/course-dto";
import * as courseService from "../services/course-service";

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