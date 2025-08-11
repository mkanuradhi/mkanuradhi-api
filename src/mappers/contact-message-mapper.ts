import ContactMessageDocument from "../documents/contact-message-document";
import ContactMessage, { FullContactMessage } from "../interfaces/i-contact-message";
import { mapDocument, mapDocuments } from "./generic-mapper";

export const mapDocumentToContactMessage = (doc: ContactMessageDocument): ContactMessage => {
  return mapDocument(doc) as ContactMessage;
};

export const mapDocumentsToContactMessages = (docs: ContactMessageDocument[]): ContactMessage[] => {
  return mapDocuments(docs) as ContactMessage[];
};

export const mapDocumentToFullContactMessage = (doc: ContactMessageDocument): FullContactMessage => {
  return mapDocument(doc) as FullContactMessage;
};

export const mapDocumentsToFullContactMessages = (docs: ContactMessageDocument[]): FullContactMessage[] => {
  return mapDocuments(docs) as FullContactMessage[];
};
