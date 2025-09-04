import AwardDocument from "../documents/award-document";
import Award from "../interfaces/i-award";
import { mapDocument, mapDocuments } from "./generic-mapper";

export const mapDocumentToAward = (doc: AwardDocument): Award => {
  return mapDocument(doc) as Award;
};

export const mapDocumentsToAwards = (docs: AwardDocument[]): Award[] => {
  return mapDocuments(docs) as Award[];
};