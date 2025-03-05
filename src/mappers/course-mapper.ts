import CourseDocument from "../documents/course-document";
import Course from "../interfaces/i-course";
import { mapDocument } from "./generic-mapper";


export const mapDocumentToCourse = (doc: CourseDocument): Course => {
  return mapDocument(doc) as Course;
};