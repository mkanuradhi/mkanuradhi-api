import { Types } from "mongoose";
import BaseDocument from "./base-document";

interface QuizDocument extends BaseDocument {
  titleEn: string;
  titleSi: string;
  duration: number; // Duration in minutes
  courseId: Types.ObjectId | string;
}

export default QuizDocument;
