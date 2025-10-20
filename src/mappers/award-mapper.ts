import AwardDocument from "../documents/award-document";
import Award from "../interfaces/i-award";
import AwardView from "../interfaces/i-award-view";
import { capitalizeLang } from "../utils/common-util";
import { mapDocument, mapDocuments } from "./generic-mapper";

export const mapDocumentToAward = (doc: AwardDocument): Award => {
  return mapDocument(doc) as Award;
};

export const mapDocumentsToAwards = (docs: AwardDocument[]): Award[] => {
  return mapDocuments(docs) as Award[];
};

export const mapDocumentToAwardView = (lang: string, doc: AwardDocument): AwardView => {
  const view = mapDocument(doc) as AwardView & Record<string, any>;

  const langSuffix = capitalizeLang(lang);

  // Assign language-specific fields
  view.title = view[`title${langSuffix}`];
  view.description = view[`description${langSuffix}`];
  view.issuer = view[`issuer${langSuffix}`];
  view.issuerLocation = view[`issuerLocation${langSuffix}`];
  view.ceremonyLocation = view[`ceremonyLocation${langSuffix}`];
  view.coRecipients = view[`coRecipients${langSuffix}`];

  // Remove unnecessary fields
  delete view[`title${langSuffix}`];
  delete view[`subtitle${langSuffix}`];
  delete view[`description${langSuffix}`];
  delete view[`location${langSuffix}`];

  return view;
}

export const mapDocumentsToAwardViews = (lang: string, docs: AwardDocument[]): AwardView[] => {
  return docs.map((doc) => mapDocumentToAwardView(lang, doc));
}