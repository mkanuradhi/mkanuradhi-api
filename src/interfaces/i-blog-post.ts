import DocumentStatus from "../enums/document-status";

interface BlogPost {
  id: string;
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
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  v: number;
}

export default BlogPost;