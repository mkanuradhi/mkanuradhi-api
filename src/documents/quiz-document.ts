import { Types } from "mongoose";
import BaseDocument from "./base-document";
import DocumentStatus from "../enums/document-status";

interface QuizMcq {
  id: Types.ObjectId | string;
}

interface QuizDocument extends BaseDocument {
  titleEn: string;
  titleSi: string;
  duration: number; // Duration in minutes
  availableFrom: Date;
  availableUntil: Date;
  courseId: Types.ObjectId | string;
  mcqs: QuizMcq[];
  status: DocumentStatus;
  deleted: boolean;
}

export default QuizDocument;
