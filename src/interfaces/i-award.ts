import AwardCategory from "../enums/award-category";
import AwardResult from "../enums/award-result";
import AwardRole from "../enums/award-role";
import AwardScope from "../enums/award-scope";
import AwardType from "../enums/award-type";
import DocumentStatus from "../enums/document-status";

interface Award {
  id: string;

  titleEn: string;
  descriptionEn: string;
  issuerEn: string; // Issuing organization full name in English
  issuerLocationEn: string; // city, country in English
  ceremonyLocationEn: string; // city, country in English
  coRecipientsEn: string[]; // array of names in English

  titleSi: string;
  descriptionSi: string;
  issuerSi: string; // Issuing organization full name in Sinhala
  issuerLocationSi: string; // city, country in Sinhala
  ceremonyLocationSi: string; // city, country in Sinhala
  coRecipientsSi: string[]; // array of names in Sinhala

  year: number;
  receivedDate: Date;
  type: AwardType; // award | grant | fellowship | scholarship | prize | recognition
  scope: AwardScope; // international | national | university | faculty | department
  role: AwardRole; // individual | team | supervisor
  result: AwardResult; // won | shortlisted | nominated | finalist
  category: AwardCategory; // research, teaching, service, leadership, innovation

  eventUrl: string; // award/issuer page
  relatedWorkUrl: string; // publication/project/talk that earned the award
  monetaryValue: string; // amount & currency (if relevant)

  issuerImage: string; // logo of the issuer
  primaryImage: string; // photo from ceremony, trophy, or issuer badge

  status: DocumentStatus;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  v: number;
}

export default Award;