import { LocalizedString } from "../types/locale.types";

export interface PreviewImage {
  id:           string;
  url:          string;
  caption?:     LocalizedString;
  displayOrder: number;
}

export interface LocalizedPreviewImage {
  id:           string;
  url:          string;
  caption?:     string;
  displayOrder: number;
}
