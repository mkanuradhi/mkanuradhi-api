import ContactMessageDocument from "../documents/contact-message-document";
import ContactMessage from "../interfaces/i-contact-message";
import { mapDocument, mapDocuments } from "./generic-mapper";

export const mapDocumentToContactMessage = (doc: ContactMessageDocument): ContactMessage => {
  return mapDocument(doc) as ContactMessage;
};

export const mapDocumentsToContactMessages = (docs: ContactMessageDocument[]): ContactMessage[] => {
  return mapDocuments(docs) as ContactMessage[];
};
