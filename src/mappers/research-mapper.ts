import ResearchDocument from "../documents/research-document";
import Research from "../interfaces/i-research";
import { mapDocument, mapDocuments } from "./generic-mapper";

export const mapDocumentToResearch = (doc: ResearchDocument): Research => {
  return mapDocument(doc) as Research;
};

export const mapDocumentsToResearches = (docs: ResearchDocument[]): Research[] => {
  return mapDocuments(docs) as Research[];
};
