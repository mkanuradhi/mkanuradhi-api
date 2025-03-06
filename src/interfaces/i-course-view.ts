import DocumentStatus from "../enums/document-status";

interface CourseQuiz {
  id: string;
  title: string;
}

interface CourseView {
  id: string;
  year: number;
  code: string;
  credits: number;
  title: string;
  subtitle: string;
  description: string;
  location: string;
  path: string;
  quizzes: CourseQuiz[];
  status: DocumentStatus;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  v: number;
}

export default CourseView;