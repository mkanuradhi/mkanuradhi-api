import DocumentStatus from "../enums/document-status";
import PublicationType from "../enums/publication-type";
import { VersionDto } from "./base-dto";

export interface ActivationPublicationDto {
  status: DocumentStatus;
}

export interface CreatePublicationDto {
  type: PublicationType;
  year: number;
  description: string;
  url: string;
  venue: string;
  bibtex: string;
}

export interface UpdatePublicationDto extends CreatePublicationDto, VersionDto {
}
