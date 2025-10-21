import AwardCategory from "../enums/award-category";
import AwardResult from "../enums/award-result";
import AwardRole from "../enums/award-role";
import AwardScope from "../enums/award-scope";
import AwardType from "../enums/award-type";
import DocumentStatus from "../enums/document-status";
import { VersionDto } from "./base-dto";


export interface ActivationAwardDto {
  status: DocumentStatus;
}

export interface CreateAwardEnDto {
  titleEn: string;
  descriptionEn: string;
  issuerEn: string;
  issuerLocationEn: string;
  ceremonyLocationEn: string;
  coRecipientsEn: string[];

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
}

export interface UpdateAwardEnDto extends CreateAwardEnDto, VersionDto {
}

export interface UpdateAwardSiDto extends VersionDto {
  titleSi: string;
  descriptionSi: string;
  issuerSi: string;
  issuerLocationSi: string;
  ceremonyLocationSi: string;
  coRecipientsSi: string[];
}