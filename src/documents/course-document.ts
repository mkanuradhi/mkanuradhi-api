import { Types } from "mongoose";
import BaseDocument from "./base-document";
import DocumentStatus from "../enums/document-status";
import DeliveryMode from "../enums/delivery-mode";
import DegreeType from "../enums/degree-type";

interface CourseQuiz {
  id: Types.ObjectId | string;
  titleEn: string;
  titleSi: string;
}

interface CourseDocument extends BaseDocument {
  year: number;
  degreeType: DegreeType;
  code: string;
  credits: number;
  mode: DeliveryMode;
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