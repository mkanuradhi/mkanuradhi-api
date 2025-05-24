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
  source: string;
  authors: PublicationAuthor[];
  publicationStatus: PublicationStatus;
  tags: string[];
	publicationUrl?: string;
	pdfUrl?: string;
	doiUrl?: string;
	preprintUrl?: string;
  abstract?: string;
  bibtex?: string;
  status: DocumentStatus;
  deleted: boolean;
}

export default PublicationDocument;
