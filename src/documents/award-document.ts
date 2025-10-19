import AwardCategory from "../enums/award-category";
import AwardResult from "../enums/award-result";
import AwardRole from "../enums/award-role";
import AwardScope from "../enums/award-scope";
import AwardType from "../enums/award-type";
import DocumentStatus from "../enums/document-status";
import BaseDocument from "./base-document";

interface AwardDocument extends BaseDocument {
  titleEn: string;
  descriptionEn: string;
  issuerEn: string;
  issuerLocationEn: string;
  ceremonyLocationEn: string;
  coRecipientsEn: string[];

  titleSi: string;
  descriptionSi: string;
  issuerSi: string;
  issuerLocationSi: string;
  ceremonyLocationSi: string;
  coRecipientsSi: string[];

  year: number;
  receivedDate: Date;
  type: AwardType;
  scope: AwardScope;
  role: AwardRole;
  result: AwardResult;
  category: AwardCategory;

  eventUrl: string;
  relatedWorkUrl: string;
  monetaryValue: string;

  issuerImage: string;
  primaryImage: string;

  status: DocumentStatus;
  deleted: boolean;
}

export default AwardDocument;