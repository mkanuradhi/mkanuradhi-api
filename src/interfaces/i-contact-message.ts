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

export interface FullContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  userAgent?: string;
  screen?: string;
  timezone?: string;
  language?: string;
  ipAddress?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  browser?: string;
  os?: string;
  deviceType?: string;
  isRead?: boolean;
  status: DocumentStatus;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  v: number;
}

export default ContactMessage;