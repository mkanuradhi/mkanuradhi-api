import { ActivationQuizDto, CreateQuizDto, UpdateQuizDto } from "../dtos/quiz-dto";
import Quiz from "../interfaces/i-quiz";
import QuizModel from "../models/quiz-model";
import CourseModel from "../models/course-model";
import AppError from "../errors/app-error";
import logger from "../config/logger-config";
import { mapDocumentsToQuizzes, mapDocumentToQuiz } from "../mappers/quiz-mapper";
import CourseDocument from "../documents/course-document";
import { validatePaginationDetails, validateQuizAvailableDates } from "../validators/common-validator";
import { v4 as uuidv4 } from 'uuid';
import DocumentStatus from "../enums/document-status";

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

export const getQuizzesByCoursePath = async (coursePath: string, page: number, size: number): Promise<{ items: Quiz[], totalCount: number }> => {
  validatePaginationDetails(page, size);

  const courseDoc = await CourseModel.findOne(
    { path: coursePath },
    { _id: 1 }
  ) as CourseDocument;

  const totalCount = await QuizModel.countDocuments({ courseId: courseDoc._id, deleted: false });
  const quizDocs = await QuizModel
    .find(
      {
        courseId: courseDoc._id,
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
      mcqs: 1,
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

export const getQuizByCoursePathAndId = async (coursePath: string, quizId: string): Promise<Quiz> => {
  const courseDoc = await CourseModel.findOne(
    { path: coursePath },
    { _id: 1 }
  ) as CourseDocument;

  const quizDoc = await QuizModel.findOne(
    { 
      _id: quizId,
      courseId: courseDoc._id,
      deleted: false
    }, 
    { 
      titleEn: 1,
      titleSi: 1,
      duration: 1,
      availableFrom: 1,
      availableUntil: 1,
      courseId: 1,
      mcqs: 1,
      status: 1,
      deleted: 1,
      createdAt: 1,
      updatedAt: 1,
      __v: 1
    }
  );

  if (quizDoc) {
    return mapDocumentToQuiz(quizDoc);
  } else {
    throw new AppError(`A quiz with id: ${quizId} cannot be found for the course path: ${coursePath}`, 400);
  }
}

export const updateQuiz = async (courseId: string, quizId: string, quizDto: UpdateQuizDto): Promise<Quiz> => {
  const courseDoc = await validateCourse(courseId);
  validateQuizAvailableDates(quizDto.availableFrom, quizDto.availableUntil);

  const existingQuizDoc = await QuizModel.findOne({
    _id: quizId,
    courseId,
    deleted: false,
  });
  if (!existingQuizDoc) {
      throw new AppError(`Cannot find the quiz with ID: ${quizId}. Unable to update the quiz.`, 400);
  }
  if (existingQuizDoc.__v !== quizDto.v) {
    throw new AppError(`Quiz has been modified by another process. Please refresh and try again.`, 409);
  }

  const existingQuizDocsWithTitle = await QuizModel.find({
    _id: { $ne: quizId },
    courseId: courseId,
    titleEn: quizDto.titleEn.trim(),
    deleted: false,
  });
  if (existingQuizDocsWithTitle && existingQuizDocsWithTitle.length > 0) {
    throw new AppError(`Existing quiz found with the title: ${quizDto.titleEn} for the course: ${courseDoc.titleEn}`, 400);
  }

  const updatedQuizDoc = await QuizModel.findByIdAndUpdate(
    quizId,
    { 
      $set: {
        titleEn: quizDto.titleEn,
        titleSi: quizDto.titleSi,
        duration: quizDto.duration,
        availableFrom: quizDto.availableFrom,
        availableUntil: quizDto.availableUntil,
      },
      $inc: { __v: 1 }
    },
    { new: true }
  );

  if (!updatedQuizDoc) {
      throw new AppError('Failed to update quiz document.', 500);
  }

  // Update the quiz summary in the course's quizzes array in one atomic operation.
  await CourseModel.updateOne(
    { _id: courseId, "quizzes.id": quizId },
    { $set: {
        "quizzes.$.titleEn": updatedQuizDoc.titleEn,
        "quizzes.$.titleSi": updatedQuizDoc.titleSi,
      }
    }
  );

  logger.info(`Quiz updated for ID: ${quizId}`);
  return mapDocumentToQuiz(updatedQuizDoc);
}

export const toggleQuizActivation = async (courseId: string, quizId: string, quizDto: ActivationQuizDto): Promise<Quiz> => {
  await validateCourse(courseId);

  const existingQuizDoc = await QuizModel.findOne({
    _id: quizId,
    courseId,
    deleted: false,
  });
  if (!existingQuizDoc) {
      throw new AppError(`Cannot find the quiz with ID: ${quizId}. Unable to toggle the status of the quiz.`, 400);
  }

  if (existingQuizDoc.status === quizDto.status) { // No change in status
    logger.info(`No change in status. Status was not updated for the quiz ID: ${quizId}`);
    return mapDocumentToQuiz(existingQuizDoc);
  }

  const updatedQuizDoc = await QuizModel.findByIdAndUpdate(
    quizId,
    { 
      $set: {
        status: quizDto.status,
      },
      $inc: { __v: 1 }
    },
    { new: true }
  );

  if (!updatedQuizDoc) {
      throw new AppError('Failed to toggle the status of the quiz document.', 500);
  }

  if (quizDto.status === DocumentStatus.INACTIVE) {
    await CourseModel.updateOne(
      { _id: courseId },
      { $pull: { quizzes: { id: quizId } } }
    );
  } else if (quizDto.status === DocumentStatus.ACTIVE) {
    await CourseModel.updateOne(
      { _id: courseId },
      { 
        $push: {
          quizzes: {
            id: quizId,
            titleEn: updatedQuizDoc.titleEn,
            titleSi: updatedQuizDoc.titleSi
          }
        }
      },
    );
  }

  logger.info(`Status updated for the quiz ID: ${quizId}`);
  return mapDocumentToQuiz(updatedQuizDoc);
}

export const deleteQuiz = async (courseId: string, quizId: string): Promise<void> => {
  const quizDoc = await QuizModel.findOne({ 
    _id: quizId,
    courseId,
    deleted: false,
  });
  if (!quizDoc) {
    throw new AppError(`Cannot find a quiz with ID '${quizId}' or it is already deleted.`, 404);
  }

  const deletedTitleEn = `${quizDoc.titleEn}-DELETED-${uuidv4()}`.substring(0, 200);
  const deletedTitleSi = `${quizDoc.titleSi}-DELETED-${uuidv4()}`.substring(0, 200);

  const updatedQuizDoc = await QuizModel.findByIdAndUpdate(
    quizId,
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
  if (!updatedQuizDoc) {
    throw new AppError('Failed to delete quiz document.', 500);
  }

  await CourseModel.updateOne(
    { _id: courseId },
    { $pull: { quizzes: { id: quizId } } }
  );
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
