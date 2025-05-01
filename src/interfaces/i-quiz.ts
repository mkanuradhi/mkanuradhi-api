import DocumentStatus from "../enums/document-status";

interface McqChoice {
  text: string;
  isCorrect: boolean;
}

interface QuizMcq {
  id: string;
  question: string;
  choices: McqChoice[];
}

interface Quiz {
  id: string;
  titleEn: string;
  titleSi: string;
  descriptionEn: string;
  descriptionSi: string;
  duration: number;
  availableFrom: Date;
  availableUntil: Date;
  courseId: string;
  mcqs: QuizMcq[];
  status: DocumentStatus;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  v: number;
}

export default Quiz;