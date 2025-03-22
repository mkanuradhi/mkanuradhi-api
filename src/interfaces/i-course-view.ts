import DeliveryMode from "../enums/delivery-mode";
import DocumentStatus from "../enums/document-status";

interface CourseViewQuiz {
  id: string;
  title: string;
}

interface CourseView {
  id: string;
  year: number;
  code: string;
  credits: number;
  mode: DeliveryMode;
  title: string;
  subtitle: string;
  description: string;
  location: string;
  path: string;
  quizzes: CourseViewQuiz[];
  status: DocumentStatus;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  v: number;
}

export default CourseView;