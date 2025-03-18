import { Types } from "mongoose";
import BaseDocument from "./base-document";
import DocumentStatus from "../enums/document-status";

interface QuizDocument extends BaseDocument {
  titleEn: string;
  titleSi: string;
  duration: number; // Duration in minutes
  availableFrom: Date;
  availableUntil: Date;
  courseId: Types.ObjectId | string;
  status: DocumentStatus;
  deleted: boolean;
}

export default QuizDocument;
