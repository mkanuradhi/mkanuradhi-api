import DocumentStatus from "../enums/document-status";

export interface PublishBlogPostTextDto {
  published: boolean;
}

export interface CreateBlogPostTextDto {
  titleEn: string;
  summaryEn: string;
  contentEn: string;
  pageDescriptionEn: string;
  titleSi: string;
  summarySi: string;
  contentSi: string;
  pageDescriptionSi: string;
  path?: string;
  status: DocumentStatus;
  keywords: string[];
  dateTime: Date;
}

export interface UpdateBlogPostTextDto extends CreateBlogPostTextDto {
  v: number;
}
