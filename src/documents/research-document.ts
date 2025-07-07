import BaseDocument from "./base-document";
import DocumentStatus from "../enums/document-status";
import DegreeType from "../enums/degree-type";
import SupervisionStatus from "../enums/supervision-status";
import SupervisorRole from "../enums/supervisor-role";

interface ResearchSupervisor {
  name: string;
  affiliation: string;
  profileUrl: string;
  isMe: boolean;
  role: SupervisorRole;
}

interface ResearchDocument extends BaseDocument {
  type: DegreeType;
  degree: string;
  completedYear: number;
  title: string;
  location: string;
  abstract: string;
  supervisors: ResearchSupervisor[];
  keywords: string[];
  thesisUrl: string;
  githubUrl: string;
  slidesUrl: string;
  studentName: string;
  supervisionStatus: SupervisionStatus;
  registrationNumber: string
  startedDate: Date;
  completedDate: Date;
  isMine: boolean;
  status: DocumentStatus;
  deleted: boolean;
}

export default ResearchDocument;
