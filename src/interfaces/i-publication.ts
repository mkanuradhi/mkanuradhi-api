import DocumentStatus from "../enums/document-status";
import PublicationStatus from "../enums/publication-status";
import PublicationType from "../enums/publication-type";

interface PublicationAuthor {
  name: string;
  affiliation: string;
  profileUrl: string;
  isMe: boolean;
  corresponding: boolean;
  equallyContributed: boolean;
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
  keywords: string[];
  publicationUrl: string;
  pdfUrl: string;
  doiUrl: string;
  preprintUrl: string;
  slidesUrl: string;
  abstract: string;
  bibtex: string;
  ris: string;
  publishedDate: Date;
  status: DocumentStatus;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  v: number;
}

export default Publication;
