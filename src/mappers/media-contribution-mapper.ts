import MediaContributionDocument from "../documents/media-contribution-document";
import MediaContribution from "../interfaces/i-media-contribution";
import { mapDocument, mapDocuments } from "./generic-mapper";

export const mapDocumentToMediaContribution = (doc: MediaContributionDocument): MediaContribution => {
  return mapDocument(doc) as MediaContribution;
};

export const mapDocumentsToMediaContributions = (docs: MediaContributionDocument[]): MediaContribution[] => {
  return mapDocuments(docs) as MediaContribution[];
};
