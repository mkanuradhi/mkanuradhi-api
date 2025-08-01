import DocumentStatus from "../enums/document-status";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  status: DocumentStatus;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  v: number;
}

export default ContactMessage;