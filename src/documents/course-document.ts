import { Types } from "mongoose";
import BaseDocument from "./base-document";
import DocumentStatus from "../enums/document-status";

interface CourseQuiz {
  id: Types.ObjectId | string;
  titleEn: string;
  titleSi: string;
}

interface CourseDocument extends BaseDocument {
  year: number;
  code: string;
  credits: number;
  titleEn: string;
  subtitleEn: string;
  descriptionEn: string;
  locationEn: string;
  titleSi: string;
  subtitleSi: string;
  descriptionSi: string;
  locationSi: string;
  path: string;
  quizzes: CourseQuiz[];
  status: DocumentStatus;
  deleted: boolean;
}

export default CourseDocument;