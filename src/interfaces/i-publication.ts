import DocumentStatus from "../enums/document-status";
import PublicationStatus from "../enums/publication-status";
import PublicationType from "../enums/publication-type";

interface PublicationAuthor {
  name: string;
  isMe: boolean;
  corresponding: boolean;
}

interface Publication {
  id: string;
  type: PublicationType;
  year: number;
  title: string;
  source: string;
	authors: PublicationAuthor[];
	publicationStatus: PublicationStatus;
	tags: string[];
	publicationUrl: string;
	pdfUrl: string;
	doiUrl: string;
	preprintUrl: string;
  abstract: string;
  bibtex: string;
  status: DocumentStatus;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  v: number;
}

export default Publication;