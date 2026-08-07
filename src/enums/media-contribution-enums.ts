export const MEDIA_CONTRIBUTION_TYPES = [
  'newspaper_article',
  'expert_interview',
  'tv_interview',
  'podcast',
  'radio',
  'other',
] as const;

export type MediaContributionType = typeof MEDIA_CONTRIBUTION_TYPES[number];

export const MEDIA_CONTRIBUTION_ROLES = [
  'author',
  'co_author',
  'interviewee',
  'contributor',
] as const;

export type MediaContributionRole = typeof MEDIA_CONTRIBUTION_ROLES[number];

export const AUTHORED_ROLES: readonly MediaContributionRole[] = [
  'author',
  'co_author',
];

export const MEDIA_CONTRIBUTION_LANGUAGES = [
  'en',
  'si',
  'ta',
] as const;

export type MediaContributionLanguage = typeof MEDIA_CONTRIBUTION_LANGUAGES[number];
