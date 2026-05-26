import { BookLanguage } from "../enums/book-enums";
import DocumentStatus from "../enums/document-status";
import { BookAuthor } from "../interfaces/i-book";
import { LocalizedString } from "../types/locale.types";
import { VersionDto } from "./base-dto";

export interface ActivationBookDto {
  status: DocumentStatus;
}

export interface CreateBookDto {
  title: LocalizedString;
  subtitle?: LocalizedString;
  description: LocalizedString;
  content: LocalizedString;
  subject: LocalizedString[];
  authors: BookAuthor[];
  writtenLang: BookLanguage;

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
}

export interface UpdateBookDto extends Partial<CreateBookDto>, VersionDto {
}