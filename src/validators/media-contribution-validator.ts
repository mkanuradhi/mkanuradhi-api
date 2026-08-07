import { z } from 'zod';
import { localizedStringSchema, optionalLocalizedStringSchema } from './common-validator';
import { AUTHORED_ROLES, MEDIA_CONTRIBUTION_LANGUAGES, MEDIA_CONTRIBUTION_ROLES, MEDIA_CONTRIBUTION_TYPES } from '../enums/media-contribution-enums';

const MAX_TITLE_LENGTH       = 500;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_CONTENT_LENGTH     = 7000;

// ----------------------- Sub-schemas -----------------------
const mediaContributionAuthorSchema = z.object({
  name:       localizedStringSchema,
  profileUrl: z.url('Invalid profile URL.').optional(),
  // id and imageUrl intentionally excluded
});

const mediaContributionOutletSchema = z.object({
  name:     localizedStringSchema,
  webUrl:   z.url('Invalid website URL.').optional(),
  // imageUrl intentionally excluded
});

function uniqueAuthorNames(authors: { name: { en?: string } }[]) {
  const names = authors.map(a => (a.name.en ?? '').trim().toLowerCase());
  return new Set(names).size === names.length;
}

const mediaContributionAuthorArraySchema = z.array(mediaContributionAuthorSchema)
  .refine(uniqueAuthorNames, { message: 'Author names must be unique.' });


const mediaContributionInterviewerArraySchema = z.array(mediaContributionAuthorSchema)
  .refine(uniqueAuthorNames, { message: 'Interviewer names must be unique.' });

const localizedDescriptionSchema = localizedStringSchema.refine(
  data => (!data.en || data.en.length <= MAX_DESCRIPTION_LENGTH) &&
          (!data.si || data.si.length <= MAX_DESCRIPTION_LENGTH),
  { message: `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.` }
);

const localizedContentSchema = localizedStringSchema.refine(
  data => (!data.en || data.en.length <= MAX_CONTENT_LENGTH) &&
          (!data.si || data.si.length <= MAX_CONTENT_LENGTH),
  { message: `Content cannot exceed ${MAX_CONTENT_LENGTH} characters.` }
);

// ----------------------- Create schema -----------------------
export const createMediaContributionSchema = z.object({
  title: localizedStringSchema,
  titleOriginal: z.string().trim().max(MAX_TITLE_LENGTH),
  subtitle: optionalLocalizedStringSchema,
  subtitleOriginal: z.string().trim().max(MAX_TITLE_LENGTH).optional(),
  description: localizedDescriptionSchema,
  content: localizedContentSchema.optional(),

  type: z.enum(MEDIA_CONTRIBUTION_TYPES, {
    error: (ctx) => ({ message: `Invalid type '${ctx.input}'. Valid types are: ${MEDIA_CONTRIBUTION_TYPES.join(', ')}.` })
  }),
  role: z.enum(MEDIA_CONTRIBUTION_ROLES, {
    error: (ctx) => ({ message: `Invalid role '${ctx.input}'. Valid roles are: ${MEDIA_CONTRIBUTION_ROLES.join(', ')}.` })
  }),
  
  topics:       z.array(localizedStringSchema).default([]),
  authors:      mediaContributionAuthorArraySchema.optional(),
  language: z.enum(MEDIA_CONTRIBUTION_LANGUAGES, {
    error: (ctx) => ({ message: `Invalid language '${ctx.input}'. Valid languages are: ${MEDIA_CONTRIBUTION_LANGUAGES.join(', ')}.` })
  }),
  interviewers: mediaContributionInterviewerArraySchema.optional(),

  outlet:           mediaContributionOutletSchema.optional(),
  publishedDate:    z.coerce.date().max(new Date(), 'Published date cannot be in the future.'),
  durationSeconds:  z.number().int().min(0, 'Duration cannot be negative.').optional(),
  highlightQuote:   optionalLocalizedStringSchema,

  sourceUrl:     z.url('Invalid source URL.').optional(),
  featured:     z.boolean().default(false),
  displayOrder: z.number().int().min(0).optional(),
}).refine(
  data => {
    if (AUTHORED_ROLES.includes(data.role)) {
      return !!data.authors && data.authors.length > 0;
    }
    return true;
  },
  { message: 'authors is required when role is sole_author or co_author.', path: ['authors'] }
);

