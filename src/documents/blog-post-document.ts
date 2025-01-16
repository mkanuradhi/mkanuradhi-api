import BaseDocument from "./base-document";
import DocumentStatus from "../enums/document-status";

interface BlogPostDocument extends BaseDocument {
  titleEn: string;
  summaryEn: string;
  contentEn: string;
  pageDescriptionEn: string;
  titleSi: string;
  summarySi: string;
  contentSi: string;
  pageDescriptionSi: string;
  primaryImage: string;
  images: string[];
  path: string;
  status: DocumentStatus;
  keywords: string[];
  dateTime: Date;
  published: boolean;
  deleted: boolean;
}

export default BlogPostDocument;
