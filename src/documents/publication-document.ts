import BaseDocument from "./base-document";
import DocumentStatus from "../enums/document-status";
import PublicationType from '../enums/publication-type';

interface PublicationDocument extends BaseDocument {
  type: PublicationType;
  year: number;
  description: string;
  url?: string;
  venue?: string;
  bibtex?: string;
  status: DocumentStatus;
  deleted: boolean;
}

export default PublicationDocument;
