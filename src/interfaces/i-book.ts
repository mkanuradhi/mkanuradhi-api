import { BookAuthorRole, BookLanguage } from "../enums/book-enums";
import DocumentStatus from "../enums/document-status";
import { LocalizedString } from "../types/locale.types";
import AppUser from "./i-app-user";

export interface BookAuthor {
  name: LocalizedString;
  role: BookAuthorRole;
  profileUrl?: string;
}

interface Book {
  id: string;

  title: LocalizedString;
  subtitle?: LocalizedString;
  description: LocalizedString;
  content: LocalizedString;
  subject: LocalizedString[];
  authors: BookAuthor[];
  writtenLang: BookLanguage;
  path: string;

  publisher: LocalizedString;
  publishedYear: number;
  edition?: string;
  isbn?: string;
  pages?: number;
  tags: string[];

  // Media & links
  coverImage?:    string;
  previewImages?:  string[];
  buyLink?:        string;
  pdfTeaser?:     string;

  // Portfolio display
  featured:      boolean;
  displayOrder?: number;

  status: DocumentStatus;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: AppUser;
  updatedBy?: AppUser;
  v: number;
}

export default Book;