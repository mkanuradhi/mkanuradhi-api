import DocumentStatus from "../enums/document-status";
import PublicationStatus from "../enums/publication-status";
import PublicationType from "../enums/publication-type";

interface PublicationAuthor {
  name: string;
  isMe: boolean;
}

interface Publication {
  id: string;
  type: PublicationType;
  year: number;
  title: string;
  description: string;
  source: string;
	authors: PublicationAuthor[];
	publicationStatus: PublicationStatus;
	tags: string[];
	paperUrl: string;
	pdfUrl: string;
	doiUrl: string;
	arxivUrl: string;
  bibtex: string;
  status: DocumentStatus;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  v: number;
}

export default Publication;