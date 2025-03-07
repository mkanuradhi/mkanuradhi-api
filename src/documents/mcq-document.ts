import { Types } from "mongoose";
import BaseDocument from "./base-document";

export interface Choice {
  textEn: string;
  textSi: string;
  isCorrect: boolean;
}

interface McqDocument extends BaseDocument {
  questionEn: string;
  questionSi: string;
  choices: Choice[];
  quizId: Types.ObjectId | string;
}

export default McqDocument;
