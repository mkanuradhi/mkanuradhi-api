import DocumentStatus from "../enums/document-status";

interface Quiz {
  id: string;
  titleEn: string;
  titleSi: string;
  duration: number;
  availableFrom: Date;
  availableUntil: Date;
  courseId: string;
  status: DocumentStatus;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  v: number;
}

export default Quiz;