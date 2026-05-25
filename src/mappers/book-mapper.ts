import BookDocument from "../documents/book-document";
import Book from "../interfaces/i-book";
import { mapDocument, mapDocuments } from "./generic-mapper";

export const mapDocumentToBook = (doc: BookDocument): Book => {
  return mapDocument(doc) as Book;
};

export const mapDocumentsToBooks = (docs: BookDocument[]): Book[] => {
  return mapDocuments(docs) as Book[];
};
