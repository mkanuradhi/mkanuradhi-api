import CourseDocument from "../documents/course-document";
import Course from "../interfaces/i-course";
import { mapDocument, mapDocuments } from "./generic-mapper";


export const mapDocumentToCourse = (doc: CourseDocument): Course => {
  return mapDocument(doc) as Course;
};

export const mapDocumentsToCourses = (docs: CourseDocument[]): Course[] => {
  return mapDocuments(docs) as Course[];
};
