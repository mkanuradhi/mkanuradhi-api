import DocumentStatus from "../enums/document-status";
import BaseDocument from "./base-document";

interface ContactMessageDocument extends BaseDocument {
  name: string;
  email: string;
  message: string;
  userAgent?: string;
  screen?: string;
  timezone?: string;
  language?: string;
  ipAddress?: string;
  status: DocumentStatus;
  deleted: boolean;
}

export default ContactMessageDocument;
