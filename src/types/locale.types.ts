export const SUPPORTED_LOCALES = ['en', 'si'] as const;
export type Locale = typeof SUPPORTED_LOCALES[number];
export const DEFAULT_LOCALE: Locale = 'en';

// The reusable localized string shape
export interface LocalizedString {
  en?: string;
  si?: string;
}