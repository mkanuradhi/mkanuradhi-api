import { Types } from "mongoose";
import BaseDocument from "./base-document";

export interface Choice {
  text: string;
  isCorrect: boolean;
}

interface McqDocument extends BaseDocument {
  question: string;
  choices: Choice[];
  solutionExplanation: string;
  quizId: Types.ObjectId | string;
  deleted: boolean;
}

export default McqDocument;
