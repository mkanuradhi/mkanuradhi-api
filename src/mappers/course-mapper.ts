import CourseDocument from "../documents/course-document";
import Course from "../interfaces/i-course";
import CourseView from "../interfaces/i-course-view";
import { capitalizeLang } from "../utils/common-util";
import { mapDocument, mapDocuments } from "./generic-mapper";

export const mapDocumentToCourse = (doc: CourseDocument): Course => {
  return mapDocument(doc) as Course;
};

export const mapDocumentsToCourses = (docs: CourseDocument[]): Course[] => {
  return mapDocuments(docs) as Course[];
};

export const mapDocumentToCourseView = (lang: string, doc: CourseDocument): CourseView => {
  const courseView = mapDocument(doc) as CourseView & Record<string, any>;

  const langSuffix = capitalizeLang(lang);

  // Assign language-specific fields
  courseView.title = courseView[`title${langSuffix}`];
  courseView.subtitle = courseView[`subtitle${langSuffix}`];
  courseView.description = courseView[`description${langSuffix}`];
  courseView.location = courseView[`location${langSuffix}`];

  // Remove unnecessary fields
  delete courseView[`title${langSuffix}`];
  delete courseView[`subtitle${langSuffix}`];
  delete courseView[`description${langSuffix}`];
  delete courseView[`location${langSuffix}`];

  // Map the quizzes array if it exists
  if (courseView.quizzes && Array.isArray(courseView.quizzes)) {
    courseView.quizzes = courseView.quizzes.map((quiz: any) => ({
      id: quiz.id,
      title: quiz[`title${langSuffix}`],
    }));
  }

  return courseView;
};

export const mapDocumentsToCourseViews = (lang: string, docs: CourseDocument[]): CourseView[] => {
  return docs.map((doc) => mapDocumentToCourseView(lang, doc));
};
