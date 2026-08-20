import DocumentStatus from "../enums/document-status";
import { MediaContributionLanguage, MediaContributionRole, MediaContributionType } from "../enums/media-contribution-enums";
import { LocalizedString } from "../types/locale.types";
import AppUser from "./i-app-user";

export interface MediaContributionAuthor {
  id:          string;
  name:        LocalizedString;
  isMe:        boolean;
  profileUrl?: string;
  imageUrl?:   string;
}

export interface MediaContributionInterviewer {
  id:          string;
  name:        LocalizedString;
  profileUrl?: string;
  imageUrl?:   string;
}

export interface MediaContributionOutlet {
  name:      LocalizedString;
  webUrl?:   string;
  imageUrl?: string;
}

export interface MediaContributionPreviewImage {
  id:           string;
  url:          string;
  caption?:     LocalizedString;
  displayOrder: number;
}

interface MediaContribution {
  id: string;

  title:             LocalizedString;
  titleOriginal:     string;
  subtitle?:         LocalizedString;
  subtitleOriginal?: string;
  description:       LocalizedString;
  content?:          LocalizedString;

  type: MediaContributionType;
  role: MediaContributionRole;

  topics:        LocalizedString[];
  authors?:      MediaContributionAuthor[];
  language:      MediaContributionLanguage;
  interviewers?: MediaContributionInterviewer[];
  path:          string;

  outlet?:          MediaContributionOutlet;
  publishedDate:    Date;
  durationSeconds?: number;
  highlightQuote?:  LocalizedString;

  coverImage?:    string;
  previewImages?: MediaContributionPreviewImage[];
  pdfLink?:       string;
  sourceUrl?:     string;

  featured:      boolean;
  displayOrder?: number;
  
  status: DocumentStatus;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: AppUser;
  updatedBy?: AppUser;
  v: number;
}

export interface LocalizedMediaContributionAuthor {
  id:          string;
  name:        string;
  isMe:        boolean;
  profileUrl?: string;
  imageUrl?:   string;
}

export interface LocalizedMediaContributionInterviewer {
  id:          string;
  name:        string;
  profileUrl?: string;
  imageUrl?:   string;
}

export interface LocalizedMediaContributionOutlet {
  name:      string;
  webUrl?:   string;
  imageUrl?: string;
}

export interface LocalizedMediaContributionPreviewImage {
  id:           string;
  url:          string;
  caption?:     string;
  displayOrder: number;
}

// Public detail page — full, one locale resolved
export interface LocalizedMediaContribution {
  id:            string;
  title:         string;
  titleEn:       string;
  titleOriginal: string;
  subtitle?:     string;
  subtitleEn?:   string;
  subtitleOriginal?: string;
  description:   string;
  content?:       string;

  type: MediaContributionType;
  role: MediaContributionRole;

  topics:        string[];
  authors?:      LocalizedMediaContributionAuthor[];
  language:      MediaContributionLanguage;
  interviewers?: LocalizedMediaContributionInterviewer[];
  path:          string;

  outlet?:          LocalizedMediaContributionOutlet;
  publishedDateFormatted: string;
  durationSeconds?: number;
  highlightQuote?:  LocalizedString;

  coverImage?:    string;
  previewImages?: LocalizedMediaContributionPreviewImage[];
  pdfLink?:       string;
  sourceUrl?:     string;

  featured:      boolean;
}

export interface LocalizedSummaryMediaContribution {
  title:         string;
  titleEn:       string;
  titleOriginal: string;
  subtitle?:     string;
  subtitleOriginal?: string;
  description:   string;
  language:      MediaContributionLanguage;
  path:          string;
  outlet?:       LocalizedMediaContributionOutlet;
  publishedDateFormatted: string;
  topics:        string[];
  coverImage?:   string;
  featured:      boolean;
  displayOrder?: number;
}

export default MediaContribution;
