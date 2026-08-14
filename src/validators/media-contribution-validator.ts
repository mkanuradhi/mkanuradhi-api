import { z } from 'zod';
import { localizedStringSchema, optionalLocalizedStringSchema } from './common-validator';
import { AUTHORED_ROLES, MEDIA_CONTRIBUTION_LANGUAGES, MEDIA_CONTRIBUTION_ROLES, MEDIA_CONTRIBUTION_TYPES } from '../enums/media-contribution-enums';
import DocumentStatus from '../enums/document-status';

const MAX_TITLE_LENGTH       = 500;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_CONTENT_LENGTH     = 7000;

export const MAX_MEDIA_CONTRIBUTION_PREVIEW_IMAGES = 10;

// ----------------------- Sub-schemas -----------------------
const mediaContributionAuthorSchema = z.object({
  name:       localizedStringSchema,
  isMe:       z.boolean(),
  profileUrl: z.url('Invalid profile URL.').optional(),
  // id and imageUrl intentionally excluded
});

const mediaContributionInterviewerSchema = z.object({
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
  .refine(uniqueAuthorNames, { message: 'Author names must be unique.' })
  .refine(
    authors => {
      const isMeCount = authors.filter(a => a.isMe).length;
      return isMeCount <= 1;
    },
    { message: 'Only one author can have isMe set to true.' }
  )
  .refine(
    authors => {
      if (authors.length === 0) return true;
      return authors.some(a => a.isMe === true); // if not empty, at least one must be isMe
    },
    { message: 'At least one author must have isMe set to true when authors are provided.' }
  );

const mediaContributionInterviewerArraySchema = z.array(mediaContributionInterviewerSchema)
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
  
  topics:   z.array(localizedStringSchema).default([]),
  authors:  mediaContributionAuthorArraySchema.optional(),
  language: z.enum(MEDIA_CONTRIBUTION_LANGUAGES, {
    error: (ctx) => ({ message: `Invalid language '${ctx.input}'. Valid languages are: ${MEDIA_CONTRIBUTION_LANGUAGES.join(', ')}.` })
  }),
  interviewers: mediaContributionInterviewerArraySchema.optional(),

  outlet:          mediaContributionOutletSchema.optional(),
  publishedDate:   z.coerce.date().max(new Date(), 'Published date cannot be in the future.'),
  durationSeconds: z.number().int().min(0, 'Duration cannot be negative.').optional(),
  highlightQuote:  optionalLocalizedStringSchema,

  sourceUrl:    z.url('Invalid source URL.').optional(),
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

const updateMediaContributionAuthorSchema = z.object({
  id:         z.string().trim().min(1, 'Author ID is required.').optional(), // absent = new author
  name:       localizedStringSchema,
  isMe:       z.boolean(),
  profileUrl: z.url('Invalid profile URL.').optional(),
  // imageUrl intentionally excluded — handled via separate upload endpoint
});

const updateMediaContributionInterviewerSchema = z.object({
  id:         z.string().trim().min(1, 'Author ID is required.').optional(), // absent = new author
  name:       localizedStringSchema,
  profileUrl: z.url('Invalid profile URL.').optional(),
  // imageUrl intentionally excluded — handled via separate upload endpoint
});

const updateMediaContributionAuthorArraySchema = z.array(updateMediaContributionAuthorSchema)
  .refine(uniqueAuthorNames, { message: 'Author names must be unique.' })
  .refine(
    authors => {
      const isMeCount = authors.filter(a => a.isMe).length;
      return isMeCount <= 1;
    },
    { message: 'Only one author can have isMe set to true.' }
  );

const updateMediaContributionInterviewerArraySchema = z.array(updateMediaContributionInterviewerSchema)
  .refine(uniqueAuthorNames, { message: 'Interviewer names must be unique.' });

const updateMediaContributionPreviewImageSchema = z.object({
  id:           z.string().trim().min(1, 'Preview image ID is required.'),
  caption:      optionalLocalizedStringSchema,
  displayOrder: z.number().int().min(0, 'Display order cannot be negative.'),
  // url intentionally excluded — handled via separate update endpoint
});

// ----------------------- Update schema -----------------------
export const updateMediaContributionSchema = z.object({
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
  authors:      updateMediaContributionAuthorArraySchema.optional(),
  language: z.enum(MEDIA_CONTRIBUTION_LANGUAGES, {
    error: (ctx) => ({ message: `Invalid language '${ctx.input}'. Valid languages are: ${MEDIA_CONTRIBUTION_LANGUAGES.join(', ')}.` })
  }),
  interviewers: updateMediaContributionInterviewerArraySchema.optional(),

  outlet:           mediaContributionOutletSchema.optional(),
  publishedDate:    z.coerce.date().max(new Date(), 'Published date cannot be in the future.'),
  durationSeconds:  z.number().int().min(0, 'Duration cannot be negative.').optional(),
  highlightQuote:   optionalLocalizedStringSchema,
  previewImages:    z.array(updateMediaContributionPreviewImageSchema).optional(),

  sourceUrl:     z.url('Invalid source URL.').optional(),
  featured:     z.boolean().default(false),
  displayOrder: z.number().int().min(0).optional(),

  // v defined at same level — never dropped
  v: z.number({ error: 'Version (v) is required and must be a number.' })
     .int('Version must be an integer.')
     .min(0, 'Version cannot be negative.'),
}).refine(
  data => {
    if (AUTHORED_ROLES.includes(data.role)) {
      return !!data.authors && data.authors.length > 0;
    }
    return true;
  },
  { message: 'authors is required when role is sole_author or co_author.', path: ['authors'] }
);

// ----------------------- Activation schema -----------------------
export const activationMediaContributionSchema = z.object({
  status: z.enum(DocumentStatus, {
    error: (ctx) => ({ message: `Invalid status '${ctx.input}'. Valid values are: ${Object.values(DocumentStatus).join(', ')}.` })
  }),
});

// Inferred types — no separate DTO interfaces needed
export type CreateMediaContributionDto = z.infer<typeof createMediaContributionSchema>;
export type UpdateMediaContributionDto = z.infer<typeof updateMediaContributionSchema>;
export type ActivationMediaContributionDto = z.infer<typeof activationMediaContributionSchema>;
