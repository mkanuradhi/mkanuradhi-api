import BaseDocument from "./base-document";
import DocumentStatus from "../enums/document-status";
import PublicationType from '../enums/publication-type';
import PublicationStatus from "../enums/publication-status";

interface PublicationAuthor {
  name: string;
  isMe: boolean;
}

interface PublicationDocument extends BaseDocument {
  type: PublicationType;
  year: number;
  title: string;
  description: string;
  source: string;
  authors: PublicationAuthor[];
  publicationStatus: PublicationStatus;
  tags: string[];
	paperUrl?: string;
	pdfUrl?: string;
	doiUrl?: string;
	arxivUrl?: string;
  bibtex?: string;
  status: DocumentStatus;
  deleted: boolean;
}

export default PublicationDocument;
