import BaseDocument from "./base-document";

interface CourseDocument extends BaseDocument {
  year: number;
  code: string;
  credits: number;
  titleEn: string;
  outlineEn: string;
  locationEn: string;
  titleSi: string;
  outlineSi: string;
  locationSi: string;
}

export default CourseDocument;