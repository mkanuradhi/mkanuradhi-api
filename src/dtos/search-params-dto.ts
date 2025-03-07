import DocumentStatus from "../enums/document-status";

export interface SearchParamsDto {
  query?: string;
  page?: number;
  size?: number;
  status?: DocumentStatus;
  sort?: string;
}