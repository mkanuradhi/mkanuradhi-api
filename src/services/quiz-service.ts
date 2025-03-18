import { CreateQuizDto } from "../dtos/quiz-dto";
import Quiz from "../interfaces/i-quiz";
import QuizModel from "../models/quiz-model";
import CourseModel from "../models/course-model";
import AppError from "../errors/app-error";
import logger from "../config/logger-config";
import { mapDocumentsToQuizzes, mapDocumentToQuiz } from "../mappers/quiz-mapper";
import CourseDocument from "../documents/course-document";
import { validatePaginationDetails, validateQuizAvailableDates } from "../validators/common-validator";

export const createQuiz = async (courseId: string, quizDto: CreateQuizDto): Promise<Quiz> => {
  const courseDoc =await validateCourse(courseId);
  validateQuizAvailableDates(quizDto.availableFrom, quizDto.availableUntil);

  const session = await QuizModel.startSession();

  try {
    session.startTransaction();

    const existingQuizDoc = await QuizModel.findOne({
      titleEn: quizDto.titleEn.trim(),
      courseId: courseId,
      deleted: false
    }).session(session);

    if (existingQuizDoc) {
        throw new AppError(`Existing quiz found with title: '${quizDto.titleEn}' for the course: '${courseDoc.titleEn}'`, 400);
    }

    const [quizDoc] = await QuizModel.create([{
      titleEn: quizDto.titleEn,
      titleSi: quizDto.titleSi,
      duration: quizDto.duration,
      availableFrom: quizDto.availableFrom,
      availableUntil: quizDto.availableUntil,
      courseId,
    }], { session });

    await CourseModel.updateOne(
      { _id: courseId },
      { 
        $push: {
          quizzes: {
            id: quizDoc._id,
            titleEn: quizDoc.titleEn,
            titleSi: quizDoc.titleSi
          }
        }
      },
      { session }
    );

    await session.commitTransaction();

    logger.info(`Quiz created for ${quizDto.titleEn}`);
    return mapDocumentToQuiz(quizDoc);
  } catch (error) {
    await session.abortTransaction();
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(`Quiz creation failed: ${error.message}`, 500);
    } else {
      throw new AppError("Quiz creation failed", 500);
    }
  } finally {
    session.endSession();
  }
}

export const getQuizzes = async (courseId: string, page: number, size: number): Promise<{ items: Quiz[], totalCount: number }> => {
  validatePaginationDetails(page, size);
  const totalCount = await QuizModel.countDocuments({ courseId, deleted: false });
  const quizDocs = await QuizModel
    .find(
      {
        courseId,
        deleted: false,
      }, 
      {
        titleEn: 1, 
        titleSi: 1,
        duration: 1,
        availableFrom: 1,
        availableUntil: 1,
        status: 1,
      })
    .sort({ year: -1 })
    .skip(page * size)
    .limit(size);

  return {
    items: mapDocumentsToQuizzes(quizDocs),
    totalCount
  };
}

export const getQuiz = async (courseId: string, quizId: string): Promise<Quiz> => {
  const courseDoc = await validateCourse(courseId);

  const quizDoc = await QuizModel.findById(
    quizId, 
    { 
      titleEn: 1,
      titleSi: 1,
      duration: 1,
      availableFrom: 1,
      availableUntil: 1,
      courseId: 1,
      status: 1,
      deleted: 1,
      createdAt: 1,
      updatedAt: 1,
      __v: 1
    }
  );

  if (quizDoc && quizDoc.courseId.toString() === courseId) {
    return mapDocumentToQuiz(quizDoc);
  } else {
    throw new AppError(`A quiz with id: ${quizId} cannot be found for the course: ${courseDoc.titleEn}`, 400);
  }
}

const validateCourse = async (courseId: string): Promise<CourseDocument> => {
  const courseDoc = await CourseModel.findOne({
    _id: courseId,
    deleted: false,
  });
  if (!courseDoc) {
    throw new AppError(`Cannot find course with ID '${courseId}'`, 404);
  }
  return courseDoc;
}
