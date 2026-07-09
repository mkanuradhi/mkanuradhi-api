import { BookAuthorRole, BookIsbnFormat, BookLanguage } from "../enums/book-enums";
import DocumentStatus from "../enums/document-status";
import { LocalizedString } from "../types/locale.types";
import AppUser from "./i-app-user";

export interface BookAuthor {
  id:          string;
  name:        LocalizedString;
  role:        BookAuthorRole;
  profileUrl?: string;
  imageUrl?:   string;
}

export interface BookPublisher {
  name:      LocalizedString;
  address:   LocalizedString;
  webUrl?:   string;
  imageUrl?: string;
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

export interface BookPrice {
  amount:   number;    // in smallest unit — e.g. 150000 = LKR 1500.00
  currency: string;    // ISO 4217 — "LKR", "USD", etc.
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

  publisher?: BookPublisher;
  publishedYear: number;
  edition?: string;
  isbns?: BookIsbn[];
  pages?: number;
  tags: string[];
  price?: BookPrice;

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
  id:          string;
  name:        string;
  role:        BookAuthorRole;
  profileUrl?: string;
  imageUrl?:   string;
}

export interface LocalizedBookPublisher {
  name:      string;
  address:   string;
  webUrl?:   string;
  imageUrl?: string;
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
  titleEn:       string;
  titleOriginal: string;
  subtitle?:     string;
  subtitleEn?:   string;
  subtitleOriginal?: string;
  description:   string;
  content:       string;
  subject:       string[];
  authors:       LocalizedBookAuthor[];
  path:          string;
  writtenLang:   BookLanguage;
  publisher?:    LocalizedBookPublisher;
  publishedYear: number;
  edition?:      string;
  isbns?:        BookIsbn[];
  pages?:        number;
  tags:          string[];
  price?:        BookPrice;
  coverImage?:   string;
  previewImages?: LocalizedBookPreviewImage[];
  buyLink?:      string;
  pdfTeaser?:    string;
  featured:      boolean;
}

// Public list/card — light, one locale resolved
export interface LocalizedSummaryBook {
  title:         string;
  titleEn:       string;
  titleOriginal: string;
  subtitle?:     string;
  subtitleOriginal?: string;
  description:   string;
  writtenLang:   BookLanguage;
  path:          string;
  publisher?:    LocalizedBookPublisher;
  publishedYear: number;
  subject:       string[];
  coverImage?:   string;
  featured:      boolean;
  displayOrder?: number;
}

export default Book;