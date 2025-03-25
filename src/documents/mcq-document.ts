import { Types } from "mongoose";
import BaseDocument from "./base-document";
import DocumentStatus from "../enums/document-status";

export interface Choice {
  text: string;
  isCorrect: boolean;
}

interface McqDocument extends BaseDocument {
  question: string;
  choices: Choice[];
  solutionExplanation: string;
  quizId: Types.ObjectId | string;
  status: DocumentStatus;
  deleted: boolean;
}

export default McqDocument;
