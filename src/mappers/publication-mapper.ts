import PublicationDocument from "../documents/publication-document";
import Publication from "../interfaces/i-publication";
import { mapDocument, mapDocuments } from "./generic-mapper";

export const mapDocumentToPublication = (doc: PublicationDocument): Publication => {
  return mapDocument(doc) as Publication;
};

export const mapDocumentsToPublications = (docs: PublicationDocument[]): Publication[] => {
  return mapDocuments(docs) as Publication[];
};
