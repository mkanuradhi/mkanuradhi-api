import DocumentStatus from "../enums/document-status";
import { VersionDto } from "./base-dto";

interface McqChoice {
  text: string;
  isCorrect: boolean;
}

export interface ActivationMcqDto {
  status: DocumentStatus;
}

export interface CreateMcqDto {
  question: string;
  choices: McqChoice[];
  isMultiSelect: boolean;
  solutionExplanation: string;
}

export interface UpdateMcqDto extends CreateMcqDto, VersionDto {
}
