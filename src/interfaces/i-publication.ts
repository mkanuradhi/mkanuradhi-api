import DocumentStatus from "../enums/document-status";
import PublicationType from "../enums/publication-type";

interface Publication {
  id: string;
  type: PublicationType;
  year: number;
  description: string;
  url: string;
  venue: string;
  bibtex: string;
  status: DocumentStatus;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  v: number;
}

export default Publication;