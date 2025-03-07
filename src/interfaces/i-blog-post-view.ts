import DocumentStatus from "../enums/document-status";

interface BlogPostView {
  id: string;
  title: string;
  summary: string;
  content: string;
  pageDescription: string;
  primaryImage: string;
  images: string[];
  path: string;
  status: DocumentStatus;
  keywords: string[];
  dateTime: Date;
  formattedDate: string;
  formattedTime: string;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  v: number;
}

export default BlogPostView;