import DocumentStatus from "../enums/document-status";

export interface CreateCourseEnDto {
  year: number;
  code?: string;
  credits?: number;
  titleEn: string;
  subtitleEn?: string;
  descriptionEn?: string;
  locationEn: string;
  path?: string;
  status?: DocumentStatus;
}

interface VersionDto {
  v: number;
}

export interface UpdateCourseEnDto extends CreateCourseEnDto, VersionDto {
}

export interface UpdateCourseSiDto extends VersionDto {
  titleSi: string;
  subtitleSi: string;
  descriptionSi: string;
  locationSi: string;
}
