import logger from "../config/logger-config";
import { ActivationMcqDto, CreateMcqDto, UpdateMcqDto } from "../dtos/mcq-dto";
import Mcq from "../interfaces/i-mcq";
import QuizModel from "../models/quiz-model";
import AppError from "../errors/app-error";
import QuizDocument from "../documents/quiz-document";
import McqModel from "../models/mcq-model";
import { validatePaginationDetails } from "../validators/common-validator";
import { mapDocumentsToMcqs, mapDocumentToMcq } from "../mappers/mcq-mapper";
import DocumentStatus from "../enums/document-status";
import { v4 as uuidv4 } from 'uuid';

export const createMcq = async (quizId: string, mcqDto: CreateMcqDto): Promise<Mcq> => {
  const quizDoc = await validateQuiz(quizId);

  const session = await McqModel.startSession();

  try {
    session.startTransaction();

    const existingMcqDoc = await McqModel.findOne({
      question: mcqDto.question.trim(),
      quizId: quizId,
      deleted: false
    }).session(session);

    if (existingMcqDoc) {
        throw new AppError(`Existing MCQ found with question: '${mcqDto.question}' for the quiz: '${quizDoc.titleEn}'`, 400);
    }

    let isMultiSelect = mcqDto.isMultiSelect ?? true;
    if (mcqDto.isMultiSelect === false) {
      if (mcqDto.choices) {
        isMultiSelect = mcqDto.choices.filter(c => c.isCorrect).length > 1;
      }
    }

    const [mcqDoc] = await McqModel.create([{
      question: mcqDto.question,
      choices: mcqDto.choices,
      isMultiSelect,
      solutionExplanation: mcqDto.solutionExplanation,
      quizId,
    }], { session });

    await QuizModel.updateOne(
      { _id: quizId },
      { 
        $push: {
          mcqs: {
            id: mcqDoc._id,
          }
        }
      },
      { session }
    );

    await session.commitTransaction();

    logger.info(`Mcq: '${mcqDto.question}' created for quiz: '${quizDoc.titleEn}'`);
    return mapDocumentToMcq(mcqDoc);
  } catch (error) {
    await session.abortTransaction();
    if (error instanceof AppError) {
      throw error;
    } else if (error instanceof Error) {
      throw new AppError(`Mcq creation failed: ${error.message}`, 500);
    } else {
      throw new AppError("Mcq creation failed", 500);
    }
  } finally {
    session.endSession();
  }
}

export const getMcqs = async (quizId: string, page: number, size: number): Promise<{ items: Mcq[], totalCount: number }> => {
  validatePaginationDetails(page, size);
  const totalCount = await McqModel.countDocuments({ quizId, deleted: false });
  const mcqDocs = await McqModel
    .find(
      {
        quizId,
        deleted: false,
      }, 
      {
        question: 1, 
        choices: 1,
        isMultiSelect: 1,
      })
    .skip(page * size)
    .limit(size);

  return {
    items: mapDocumentsToMcqs(mcqDocs),
    totalCount
  };
}

export const getMcq = async (quizId: string, mcqId: string): Promise<Mcq> => {
  const quizDoc = await validateQuiz(quizId);

  const mcqDoc = await McqModel.findById(
    mcqId, 
    { 
      question: 1,
      choices: 1,
      isMultiSelect: 1,
      solutionExplanation: 1,
      quizId: 1,
      status: 1,
      deleted: 1,
      createdAt: 1,
      updatedAt: 1,
      __v: 1
    }
  );

  if (mcqDoc && mcqDoc.quizId.toString() === quizId) {
    return mapDocumentToMcq(mcqDoc);
  } else {
    throw new AppError(`A mcq with id: ${mcqId} cannot be found for the quiz: ${quizDoc.titleEn}`, 400);
  }
}

export const updateMcq = async (quizId: string, mcqId: string, mcqDto: UpdateMcqDto): Promise<Mcq> => {
  const quizDoc = await validateQuiz(quizId);

  const existingMcqDoc = await McqModel.findOne({
    _id: mcqId,
    quizId,
    deleted: false,
  });
  if (!existingMcqDoc) {
      throw new AppError(`Cannot find the mcq with ID: ${mcqId}. Unable to update the mcq.`, 400);
  }
  if (existingMcqDoc.__v !== mcqDto.v) {
    throw new AppError(`Mcq has been modified by another process. Please refresh and try again.`, 409);
  }

  const existingMcqDocsWithQuestion = await McqModel.find({
    _id: { $ne: mcqId },
    quizId: quizId,
    question: mcqDto.question.trim(),
    deleted: false,
  });
  if (existingMcqDocsWithQuestion && existingMcqDocsWithQuestion.length > 0) {
    throw new AppError(`Existing mcq found with the question: ${mcqDto.question} for the quiz: ${quizDoc.titleEn}`, 400);
  }

  let isMultiSelect = mcqDto.isMultiSelect ?? true;
  if (mcqDto.isMultiSelect === false) {
    if (mcqDto.choices) {
      isMultiSelect = mcqDto.choices.filter(c => c.isCorrect).length > 1;
    }
  }

  const updatedMcqDoc = await McqModel.findByIdAndUpdate(
    mcqId,
    { 
      $set: {
        question: mcqDto.question,
        choices: mcqDto.choices,
        isMultiSelect,
        solutionExplanation: mcqDto.solutionExplanation,
      },
      $inc: { __v: 1 }
    },
    { new: true }
  );

  if (!updatedMcqDoc) {
      throw new AppError('Failed to update mcq document.', 500);
  }

  logger.info(`Mcq updated for ID: ${mcqId}`);
  return mapDocumentToMcq(updatedMcqDoc);
}

export const toggleMcqActivation = async (quizId: string, mcqId: string, mcqDto: ActivationMcqDto): Promise<Mcq> => {
  await validateQuiz(quizId);

  const existingMcqDoc = await McqModel.findOne({
    _id: mcqId,
    quizId,
    deleted: false,
  });
  if (!existingMcqDoc) {
      throw new AppError(`Cannot find the mcq with ID: ${mcqId}. Unable to toggle the status of the mcq.`, 400);
  }

  if (existingMcqDoc.status === mcqDto.status) { // No change in status
    logger.info(`No change in status. Status was not updated for the mcq ID: ${mcqId}`);
    return mapDocumentToMcq(existingMcqDoc);
  }

  const updatedMcqDoc = await McqModel.findByIdAndUpdate(
    mcqId,
    { 
      $set: {
        status: mcqDto.status,
      },
      $inc: { __v: 1 }
    },
    { new: true }
  );

  if (!updatedMcqDoc) {
      throw new AppError('Failed to toggle the status of the mcq document.', 500);
  }

  if (mcqDto.status === DocumentStatus.INACTIVE) {
    await QuizModel.updateOne(
      { _id: quizId },
      { $pull: { mcqs: { id: mcqId } } }
    );
  } else if (mcqDto.status === DocumentStatus.ACTIVE) {
    await QuizModel.updateOne(
      { _id: quizId },
      { 
        $push: {
          mcqs: {
            id: mcqId,
          }
        }
      },
    );
  }

  logger.info(`Status updated for the mcq ID: ${mcqId}`);
  return mapDocumentToMcq(updatedMcqDoc);
}

export const deleteMcq = async (quizId: string, mcqId: string): Promise<void> => {
  const mcqDoc = await McqModel.findOne({ 
    _id: mcqId,
    quizId,
    deleted: false,
  });
  if (!mcqDoc) {
    throw new AppError(`Cannot find a mcq with ID '${mcqId}' or it is already deleted.`, 404);
  }

  const deletedQuestion = `${mcqDoc.question}-DELETED-${uuidv4()}`.substring(0, 200);

  const updatedMcqDoc = await McqModel.findByIdAndUpdate(
    mcqId,
    {
      $set: {
        question: deletedQuestion,
        deleted: true,
      },
      $inc: { __v: 1 }
    },
    { new: true }
  );
  if (!updatedMcqDoc) {
    throw new AppError('Failed to delete mcq document.', 500);
  }

  await QuizModel.updateOne(
    { _id: quizId },
    { $pull: { mcqs: { id: mcqId } } }
  );
}

const validateQuiz = async (quizId: string): Promise<QuizDocument> => {
  const quizDoc = await QuizModel.findOne({
    _id: quizId,
    deleted: false,
  });
  if (!quizDoc) {
    throw new AppError(`Cannot find course with ID '${quizId}'`, 404);
  }
  return quizDoc;
}
