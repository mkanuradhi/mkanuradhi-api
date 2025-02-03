import DocumentStatus from "../enums/document-status";

export interface PublishBlogPostTextDto {
  published: boolean;
}

export interface CreateBlogPostTextEnDto {
  titleEn: string;
  summaryEn: string;
  contentEn: string;
  pageDescriptionEn: string;
  path?: string;
  status: DocumentStatus;
  keywords: string[];
  dateTime: Date;
}

export interface UpdateBlogPostTextEnDto extends CreateBlogPostTextEnDto {
  v: number;
}

export interface UpdateBlogPostTextSiDto {
  titleSi: string;
  summarySi: string;
  contentSi: string;
  pageDescriptionSi: string;
  v: number;
}
