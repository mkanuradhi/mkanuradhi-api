import { BookLanguage } from "../enums/book-enums";
import DocumentStatus from "../enums/document-status";
import { BookAuthor, BookIsbn, BookPreviewImage, BookPublisher } from "../interfaces/i-book";
import { LocalizedString } from "../types/locale.types";
import BaseDocument from "./base-document";

interface BookDocument extends BaseDocument {
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
  edition: string;
  isbns?: BookIsbn[];
  pages: number;
  tags: string[];

  // Media & links
  coverImage?:    string;
  previewImages?: BookPreviewImage[];
  buyLink?:       string;
  pdfTeaser?:     string;

  // Portfolio display
  featured:      boolean;
  displayOrder?: number;
  
  // Status
  status:  DocumentStatus;
  deleted: boolean;
}

export default BookDocument;
