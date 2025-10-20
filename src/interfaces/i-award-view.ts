import AwardCategory from "../enums/award-category";
import AwardResult from "../enums/award-result";
import AwardRole from "../enums/award-role";
import AwardScope from "../enums/award-scope";
import AwardType from "../enums/award-type";
import DocumentStatus from "../enums/document-status";

interface AwardView {
  id: string;

  title: string;
  description: string;
  issuer: string;
  issuerLocation: string;
  ceremonyLocation: string;
  coRecipients: string[];

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
  createdAt: Date;
  updatedAt: Date;
  v: number;
}

export default AwardView;