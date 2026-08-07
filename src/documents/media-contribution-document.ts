import DocumentStatus from "../enums/document-status";
import { MediaContributionLanguage, MediaContributionRole, MediaContributionType } from "../enums/media-contribution-enums";
import { MediaContributionAuthor, MediaContributionOutlet, MediaContributionPreviewImage } from "../interfaces/i-media-contribution";
import { LocalizedString } from "../types/locale.types";
import BaseDocument from "./base-document";

interface MediaContributionDocument extends BaseDocument {
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
  interviewers?: MediaContributionAuthor[];
  path:          string;

  outlet?:          MediaContributionOutlet;
  publishedDate:    Date;
  durationSeconds?: number;
  highlightQuote?:  LocalizedString;

  // Media & links
  coverImage?:    string;
  previewImages?: MediaContributionPreviewImage[];
  pdfLink?:       string;
  sourceUrl?:     string;

  // Portfolio display
  featured:      boolean;
  displayOrder?: number;
  
  // Status
  status:  DocumentStatus;
  deleted: boolean;
}

export default MediaContributionDocument;
