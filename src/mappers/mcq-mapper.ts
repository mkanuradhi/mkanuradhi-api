import McqDocument from "../documents/mcq-document";
import Mcq from "../interfaces/i-mcq";
import { mapDocument, mapDocuments } from "./generic-mapper";

export const mapDocumentToMcq = (doc: McqDocument): Mcq => {
  return mapDocument(doc) as Mcq;
};

export const mapDocumentsToMcqs = (docs: McqDocument[]): Mcq[] => {
  return mapDocuments(docs) as Mcq[];
};
