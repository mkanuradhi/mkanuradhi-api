import logger from "../config/logger-config";
import { CreateMcqDto } from "../dtos/mcq-dto";
import Mcq from "../interfaces/i-mcq";
import QuizModel from "../models/quiz-model";
import AppError from "../errors/app-error";
import QuizDocument from "../documents/quiz-document";
import McqModel from "../models/mcq-model";
import { mapDocumentToMcq } from "../mappers/mcq-mapper";

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

    const [mcqDoc] = await McqModel.create([{
      question: mcqDto.question,
      choices: mcqDto.choices,
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
