import DocumentStatus from "../enums/document-status";

interface McqChoice {
  text: string;
  isCorrect: boolean;
}

interface Mcq {
  id: string;
  question: string;
  choices: McqChoice[];
  isMultiSelect: boolean;
  solutionExplanation: string;
  quizId: string;
  status: DocumentStatus;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  v: number;
}

export default Mcq;