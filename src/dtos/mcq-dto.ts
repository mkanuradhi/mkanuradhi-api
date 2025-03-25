import { VersionDto } from "./base-dto";

interface McqChoice {
  text: string;
  isCorrect: boolean;
}

export interface CreateMcqDto {
  question: string;
  choices: McqChoice[];
  solutionExplanation: string;
}

export interface UpdateMcqDto extends CreateMcqDto, VersionDto {
}
