export const LANG_EN = "en";
export const LANG_SI = "si";
export const AVAILABLE_LANGS = [ LANG_EN, LANG_SI ];
export const DEFAULT_LANG = LANG_EN;

export const LOCALE_EN = "en-US";
export const LOCALE_SI = "si-LK";
export const DEFAULT_LOCALE = LOCALE_EN;

// Cache keys
export const SUMMARY_STATS_CACHE_KEY = "summary:stats";
export const BOOK_LIST_CACHE_KEY_PREFIX = "book:list:";
export const AWARD_LIST_CACHE_KEY_PREFIX = "award:list:";
export const MEDIA_CONTRIBUTION_LIST_CACHE_KEY_PREFIX = "media-contribution:list:";
export const BLOG_POST_LIST_CACHE_KEY_PREFIX = "blog-post:list:";

const BLOG_POSTS = 'blog-posts';
const BOOKS = 'books';
const MEDIA_CONTRIBUTIONS = 'media-contributions';

export const R2_PATHS = {
  BLOG_POSTS_IMAGES: `${BLOG_POSTS}/images`,
  BOOKS_IMAGES: `${BOOKS}/images`,
  BOOKS_PDF_FILES: `${BOOKS}/pdf-files`,
  MEDIA_CONTRIBUTIONS_IMAGES: `${MEDIA_CONTRIBUTIONS}/images`,
  MEDIA_CONTRIBUTIONS_PDF_FILES: `${MEDIA_CONTRIBUTIONS}/pdf-files`,
} as const;