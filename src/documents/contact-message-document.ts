import DocumentStatus from "../enums/document-status";
import BaseDocument from "./base-document";

interface ContactMessageDocument extends BaseDocument {
  name: string;
  email: string;
  message: string;
  status: DocumentStatus;
  deleted: boolean;
}

export default ContactMessageDocument;
