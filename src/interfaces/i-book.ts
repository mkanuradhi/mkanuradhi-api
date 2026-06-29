import { BookAuthorRole, BookIsbnFormat, BookLanguage } from "../enums/book-enums";
import DocumentStatus from "../enums/document-status";
import { LocalizedString } from "../types/locale.types";
import AppUser from "./i-app-user";

export interface BookAuthor {
  name: LocalizedString;
  role: BookAuthorRole;
  profileUrl?: string;
}

export interface BookIsbn {
  format: BookIsbnFormat;
  value: string;
}

export interface BookPreviewImage {
  id:           string;
  url:          string;
  caption?:     LocalizedString;
  displayOrder: number;
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
  isbns?: BookIsbn[];
  pages?: number;
  tags: string[];

  // Media & links
  coverImage?:    string;
  previewImages?:  BookPreviewImage[];
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

// Shared author shape for localized DTOs
export interface LocalizedBookAuthor {
  name:       string;
  role:       BookAuthorRole;
  profileUrl?: string;
}

export interface LocalizedBookPreviewImage {
  id:           string;
  url:          string;
  caption?:     string;
  displayOrder: number;
}

// Public detail page — full, one locale resolved
export interface LocalizedBook {
  id:            string;
  title:         string;
  subtitle?:     string;
  description:   string;
  content:       string;
  subject:       string[];
  authors:       LocalizedBookAuthor[];
  path:          string;
  writtenLang:   BookLanguage;
  publisher:     string;
  publishedYear: number;
  edition?:      string;
  isbns?:        BookIsbn[];
  pages?:        number;
  tags:          string[];
  coverImage?:   string;
  previewImages?: LocalizedBookPreviewImage[];
  buyLink?:      string;
  pdfTeaser?:    string;
  featured:      boolean;
}

// Public list/card — light, one locale resolved
export interface LocalizedSummaryBook {
  id:            string;
  title:         string;
  subtitle?:     string;
  description:   string;
  authors:       LocalizedBookAuthor[];
  writtenLang:   BookLanguage;
  path:          string;
  publishedYear: number;
  tags:          string[];
  coverImage?:   string;
  featured:      boolean;
  displayOrder?: number;
}

export default Book;