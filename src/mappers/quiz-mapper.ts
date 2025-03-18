import QuizDocument from "../documents/quiz-document";
import Quiz from "../interfaces/i-quiz";
import { mapDocument, mapDocuments } from "./generic-mapper";

export const mapDocumentToQuiz = (doc: QuizDocument): Quiz => {
  return mapDocument(doc) as Quiz;
};

export const mapDocumentsToQuizzes = (docs: QuizDocument[]): Quiz[] => {
  return mapDocuments(docs) as Quiz[];
};
