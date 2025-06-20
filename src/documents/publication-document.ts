import BaseDocument from "./base-document";
import DocumentStatus from "../enums/document-status";
import PublicationType from '../enums/publication-type';
import PublicationStatus from "../enums/publication-status";

interface PublicationAuthor {
  name: string;
  affiliation: string;
  profileUrl: string;
  isMe: boolean;
  corresponding: boolean;
}

interface PublicationDocument extends BaseDocument {
  type: PublicationType;
  year: number;
  title: string;
  source: string;
  authors: PublicationAuthor[];
  publicationStatus: PublicationStatus;
  tags: string[];
  keywords: string[];
  publicationUrl?: string;
  pdfUrl?: string;
  doiUrl?: string;
  preprintUrl?: string;
  slidesUrl?: string;
  abstract?: string;
  bibtex?: string;
  ris?: string;
  publishedDate?: Date | null;
  status: DocumentStatus;
  deleted: boolean;
}

export default PublicationDocument;
