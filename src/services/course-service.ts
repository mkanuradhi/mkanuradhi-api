import logger from "../config/logger-config";
import { ActivationCourseDto, CreateCourseEnDto, UpdateCourseEnDto, UpdateCourseSiDto } from "../dtos/course-dto";
import DocumentStatus from "../enums/document-status";
import Course from "../interfaces/i-course";
import CourseModel from "../models/course-model";
import AppError from "../errors/app-error";
import { mapDocumentsToCourses, mapDocumentsToCourseViews, mapDocumentToCourse, mapDocumentToCourseView } from "../mappers/course-mapper";
import { validatePaginationDetails } from "../validators/common-validator";
import { v4 as uuidv4 } from 'uuid';
import { SearchParamsDto } from "../dtos/search-params-dto";
import CourseView from "../interfaces/i-course-view";
import { buildSearchFilter, capitalizeLang } from "../utils/common-util";
import CourseDocument from "../documents/course-document";
import DegreeType from "../enums/degree-type";
import { LabelValueStat, SummaryStat, YearlyGroupStat } from "../interfaces/i-stat";

export const createCourseEn = async (courseDto: CreateCourseEnDto): Promise<Course> => {
  const existingCourseDoc = await CourseModel.findOne({
    year: courseDto.year,
    degreeType: courseDto.degreeType,
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
    degreeType: courseDto.degreeType,
    code: courseDto.code,
    credits: courseDto.credits,
    mode: courseDto.mode,
    titleEn: courseDto.titleEn,
    subtitleEn: courseDto.subtitleEn,
    descriptionEn: courseDto.descriptionEn,
    locationEn: courseDto.locationEn,
    path: courseDto.path,
    quizzes: [],
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
        degreeType: 1,
        code: 1,
        credits: 1,
        mode: 1,
        titleEn: 1, 
        subtitleEn: 1,
        locationEn: 1,
        titleSi: 1,
        subtitleSi: 1,
        locationSi: 1,
        path: 1,
        status: 1,
      })
    .sort({ year: -1 })
    .skip(page * size)
    .limit(size);

  return {
    items: mapDocumentsToCourses(courseDocs),
    totalCount
  };
}

export const getCourse = async (courseId: string): Promise<Course> => {
  const courseDoc = await CourseModel.findById(
    courseId, 
    { 
      year: 1,
      degreeType: 1,
      code: 1,
      credits: 1,
      mode: 1,
      titleEn: 1,
      subtitleEn: 1,
      descriptionEn: 1,
      locationEn: 1,
      titleSi: 1,
      subtitleSi: 1,
      descriptionSi: 1,
      locationSi: 1,
      path: 1,
      quizzes: 1,
      status: 1,
      deleted: 1,
      createdAt: 1,
      updatedAt: 1,
      __v: 1
    }
  );

  if (courseDoc) {
    return mapDocumentToCourse(courseDoc);
  } else {
    throw new AppError(`Course cannot be found for id: ${courseId}`, 400);
  }
}

export const getCourseByPath = async (lang: string, coursePath: string): Promise<CourseView> => {
  const commonFields = {
    year: 1,
    DegreeType: 1,
    code: 1,
    credits: 1,
    mode: 1,
    path: 1,
    status: 1,
    deleted: 1,
    createdAt: 1,
    updatedAt: 1,
    __v: 1,
  };
  const langFields = {
    [`title${capitalizeLang(lang)}`]: 1,
    [`subtitle${capitalizeLang(lang)}`]: 1,
    [`description${capitalizeLang(lang)}`]: 1,
    [`location${capitalizeLang(lang)}`]: 1,
  };
  const quizLangFields = {
    "quizzes.id": 1,
    [`quizzes.title${capitalizeLang(lang)}`]: 1,
  };
  const projection = { ...commonFields, ...langFields, ...quizLangFields };

  const courseDoc = await CourseModel.findOne(
    { path: coursePath },
    projection
  ) as CourseDocument & Record<string, any>;

  if (!courseDoc) {
    throw new AppError(`Course cannot be found for path: ${coursePath}`, 400);
  }

  return mapDocumentToCourseView(lang, courseDoc);
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
    year: courseDto.year,
    degreeType: courseDto.degreeType,
    code: courseDto.code,
    titleEn: courseDto.titleEn.trim(),
    locationEn: courseDto.locationEn.trim(),
    deleted: false,
  });
  if (existingCourseDocsWithTitle && existingCourseDocsWithTitle.length > 0) {
    throw new AppError(`Existing course found for the year: ${courseDto.year}, code: ${courseDto.code}, title: ${courseDto.titleEn} and location: ${courseDto.locationEn}`, 400);
  }

  const updatedCourseDoc = await CourseModel.findByIdAndUpdate(
    courseId,
    { 
      $set: {
        year: courseDto.year,
        degreeType: courseDto.degreeType,
        code: courseDto.code,
        credits: courseDto.credits,
        mode: courseDto.mode,
        titleEn: courseDto.titleEn,
        subtitleEn: courseDto.subtitleEn,
        descriptionEn: courseDto.descriptionEn,
        locationEn: courseDto.locationEn,
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

export const updateCourseSi = async (courseId: string, courseDto: UpdateCourseSiDto): Promise<Course> => {
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
    year: existingCourseDoc.year,
    code: existingCourseDoc.code,
    titleSi: courseDto.titleSi.trim(),
    locationSi: courseDto.locationSi.trim(),
    deleted: false,
  });
  if (existingCourseDocsWithTitle && existingCourseDocsWithTitle.length > 0) {
    throw new AppError(`Existing course found for the year: ${existingCourseDoc.year}, code: ${existingCourseDoc.code}, title: ${courseDto.titleSi} and location: ${courseDto.locationSi}`, 400);
  }

  const updatedCourseDoc = await CourseModel.findByIdAndUpdate(
    courseId,
    { 
      $set: {
        titleSi: courseDto.titleSi,
        subtitleSi: courseDto.subtitleSi,
        descriptionSi: courseDto.descriptionSi,
        locationSi: courseDto.locationSi,
      },
      $inc: { __v: 1 }
    },
    { new: true }
  );

  if (!updatedCourseDoc) {
    throw new AppError('Failed to update course document.', 500);
  }

  logger.info(`Course updated for ID: ${courseId} and title Si: ${courseDto.titleSi}`);
  return mapDocumentToCourse(updatedCourseDoc);
}

export const toggleCourseActivation = async (courseId: string, courseDto: ActivationCourseDto): Promise<Course> => {
  const existingCourseDoc = await CourseModel.findOne({
    _id: courseId,
    deleted: false,
  });
  if (!existingCourseDoc) {
      throw new AppError(`Cannot find the course with ID: ${courseId}. Unable to update the course.`, 400);
  }

  if (courseDto.status === DocumentStatus.ACTIVE) { // check sinhala details are available only when course is going to be activated
    if (!existingCourseDoc.titleSi?.trim() || !existingCourseDoc.locationSi?.trim()) {
      throw new AppError("Missing or empty required fields in Sinhala: Either the title or location is missing.", 400);
    }
  }

  const updatedCourseDoc = await CourseModel.findByIdAndUpdate(
    courseId,
    { 
      $set: {
        status: courseDto.status,
      },
      $inc: { __v: 1 }
    },
    { new: true }
  );

  if (!updatedCourseDoc) {
      throw new AppError('Failed to update course document.', 500);
  }

  logger.info(`Course updated for status for ID: ${courseId}`);
  return mapDocumentToCourse(updatedCourseDoc);
}

export const deleteCourse = async (courseId: string): Promise<void> => {
  const courseDoc = await CourseModel.findOne({ 
    _id: courseId,
    deleted: false,
  });
  if (!courseDoc) {
    throw new AppError(`Cannot find the course with ID '${courseId}' or it is already deleted.`, 404);
  }

  const deletedTitleEn = `${courseDoc.titleEn}-DELETED-${uuidv4()}`;
  const deletedTitleSi = `${courseDoc.titleSi}-DELETED-${uuidv4()}`;
  const deletedPath = `${courseDoc.path}-DELETED-${uuidv4()}`;

  const updatedCourseDoc = await CourseModel.findByIdAndUpdate(
    courseId,
    {
      $set: {
        titleEn: deletedTitleEn,
        titleSi: deletedTitleSi,
        path: deletedPath,
        deleted: true,
      },
      $inc: { __v: 1 }
    },
    { new: true }
  );
  if (!updatedCourseDoc) {
    throw new AppError('Failed to delete course document.', 500);
  }
}

export const searchCourses = async (lang: string, searchParams: SearchParamsDto): Promise<{ courseViews: CourseView[]; totalCount: number; }> => {
  const {page = 0, size = 200, sort} = searchParams;
  
  validatePaginationDetails(page, size);

  const searchFilter = buildSearchFilter(searchParams);
  const sortOptions = getSortOptions(sort);

  const commonFields = {
    year: 1,
    code: 1,
    credits: 1,
    mode: 1,
    path: 1,
  };

  const langFields = {
    [`title${capitalizeLang(lang)}`]: 1,
    [`subtitle${capitalizeLang(lang)}`]: 1,
    [`location${capitalizeLang(lang)}`]: 1,
  };

  const projection = { ...commonFields, ...langFields };
  
  const [courseDocs, totalCount] = await Promise.all([
    // Fetch paginated sourses
    CourseModel.find(searchFilter, projection)
      .sort(sortOptions)
      .skip(page * size)
      .limit(size),
    
    // Count total documents for the query
    CourseModel.countDocuments(searchFilter),
  ]);

  const courseViews: CourseView[] = mapDocumentsToCourseViews(lang, courseDocs);

  return { courseViews, totalCount };
}

const getSortOptions = (sort?: string): Record<string, 1 | -1> => {
  const defaultSort: Record<string, 1 | -1> = { year: -1, code: -1, updatedAt: -1 };
  if (!sort) {
    return defaultSort;
  }

  switch (sort) {
    case "latest": return { year: -1 };
    case "oldest": return { year: 1 };
    default: return defaultSort;
  }
};

export const getCourseSummary = async (): Promise<SummaryStat> => {
  const matchStage = {
    deleted: false,
    status : DocumentStatus.ACTIVE,
  };

  const [result] = await CourseModel.aggregate<{
    total:               { value: number }[];
    byType:              LabelValueStat[];
    byPublicationStatus: LabelValueStat[];
  }>([
    { $match: matchStage },

    {
      $facet: {
        total: [{ $count: 'value' }],

        byType: [
          { $group: { _id: '$degreeType', value: { $sum: 1 } } },
          { $project: { _id: 0, label: '$_id', value: 1 } },
        ],

      },
    },
  ]);

  // post-process to ensure ALL enum values appear

  // 1. Total
  const stats: LabelValueStat[] = [
    { label: 'Total', value: result.total[0]?.value ?? 0 },
  ];

  // 2.a By-type – guarantee every DegreeType enum key exists
  const valueByType = new Map(result.byType.map(e => [e.label, e.value]));
  const byType: LabelValueStat[] = (
    Object.values(DegreeType) as DegreeType[]
  ).map(label => ({
    label,
    value: valueByType.get(label) ?? 0,
  }));

  return {
    stats,
    grouped: {
      byType,
    },
  };
};

export const getYearlyCoursesByType = async (): Promise<YearlyGroupStat[]> => {
  const results = await CourseModel.aggregate<YearlyGroupStat>([
    {
      $match: {
        deleted: false,
        status: DocumentStatus.ACTIVE,
        year: { $type: 'number' },
        degreeType: { $ne: null },
      },
    },
    {
      $group: {
        _id: { year: '$year', degreeType: '$degreeType' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.degreeType': 1, '_id.year': 1 } },
    {
      $densify: {
        field: '_id.year',
        partitionByFields: ['_id.degreeType'],
        range: { step: 1, bounds: 'full' },
      },
    },
    { $set: { count: { $ifNull: ['$count', 0] } } },
    {
      $group: {
        _id: { year: '$_id.year', degreeType: '$_id.degreeType' },
        count: { $max: '$count' },      //  real count wins over 0
      },
    },
    {
      $group: {
        _id: '$_id.year',
        pairs: { $push: { k: '$_id.degreeType', v: '$count' } },
      },
    },
    {
      $project: {
        _id: 0,
        year: { $toString: '$_id' },
        data: { $arrayToObject: '$pairs' },
      },
    },
    {
      $replaceRoot: { newRoot: { $mergeObjects: [{ year: '$year' }, '$data'] } },
    },
    { $sort: { year: 1 } },
  ]);

  return results;
};
