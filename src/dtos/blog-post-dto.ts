import DocumentStatus from "../enums/document-status";
import { VersionDto } from "./base-dto";

export interface ActivationBlogPostDto {
  status: DocumentStatus;
}

export interface CreateBlogPostTextEnDto {
  titleEn: string;
  summaryEn: string;
  contentEn: string;
  pageDescriptionEn: string;
  path?: string;
  keywords: string[];
  dateTime: Date;
}

export interface UpdateBlogPostTextEnDto extends CreateBlogPostTextEnDto, VersionDto {
}

export interface UpdateBlogPostTextSiDto extends VersionDto {
  titleSi: string;
  summarySi: string;
  contentSi: string;
  pageDescriptionSi: string;
}
