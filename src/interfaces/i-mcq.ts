interface McqChoice {
  text: string;
  isCorrect: boolean;
}

interface Mcq {
  id: string;
  question: string;
  choices: McqChoice[];
  solutionExplanation: string;
  quizId: string;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  v: number;
}

export default Mcq;