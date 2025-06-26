import DocumentStatus from "../enums/document-status";
import { VersionDto } from "./base-dto";
import DegreeType from "../enums/degree-type";
import SupervisionStatus from "../enums/supervision-status";

interface ResearchSupervisorDto {
  name: string;
  affiliation?: string;
  profileUrl?: string;
  isMe?: boolean;
}

export interface ActivationResearchDto {
  status: DocumentStatus;
}

export interface CreateResearchDto {
  type: DegreeType;
  degree: string;
  completedYear: number;
  title: string;
  location: string;
  abstract: string;
  supervisors: ResearchSupervisorDto[];
  keywords: string[];
  thesisUrl: string;
  githubUrl: string;
  slidesUrl: string;
  studentName: string;
  supervisionStatus: SupervisionStatus;
  registrationNumber: string;
  startedDate: Date;
  completedDate: Date;
  isMine: boolean;
}

export interface UpdateResearchDto extends CreateResearchDto, VersionDto {
}
