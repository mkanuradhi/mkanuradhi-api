import DocumentStatus from "../enums/document-status";

export interface ActivationCourseDto {
  status: DocumentStatus;
}

export interface CreateCourseEnDto {
  year: number;
  code?: string;
  credits?: number;
  titleEn: string;
  subtitleEn?: string;
  descriptionEn?: string;
  locationEn: string;
  path?: string;
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
