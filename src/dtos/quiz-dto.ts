import DocumentStatus from "../enums/document-status";
import { VersionDto } from "./base-dto";

export interface ActivationQuizDto {
  status: DocumentStatus;
}

export interface CreateQuizDto {
  titleEn: string;
  titleSi: string;
  descriptionEn: string;
  descriptionSi: string;
  duration?: number;
  availableFrom?: Date;
  availableUntil?: Date;
}

export interface UpdateQuizDto extends CreateQuizDto, VersionDto {
}
