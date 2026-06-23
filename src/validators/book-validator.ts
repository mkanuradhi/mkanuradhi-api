// src/validators/book.validator.ts
import { z } from 'zod';
import { BookAuthorRole, BookIsbnFormat, BookLanguage } from '../enums/book-enums';
import { localizedStringSchema, optionalLocalizedStringSchema } from './common-validator';
import DocumentStatus from '../enums/document-status';

const MAX_TITLE_LENGTH       = 500;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_CONTENT_LENGTH     = 5000;
const MAX_ISBN_LENGTH        = 20;
const MIN_PUBLISHED_YEAR     = 2010;

export const MAX_BOOK_PREVIEW_IMAGES = 10;

// Sub-schemas

const bookAuthorSchema = z.object({
  name:       localizedStringSchema,
  role:       z.enum(BookAuthorRole, {
                error: (ctx) => ({ message: `Invalid author role '${ctx.input}'. Valid roles are: ${Object.values(BookAuthorRole).join(', ')}.` })
              }),
  profileUrl: z.url('Invalid profile URL.').optional(),
});

const bookIsbnSchema = z.object({
  format: z.enum(BookIsbnFormat, {
    error: (ctx) => ({ message: `Invalid ISBN format '${ctx.input}'. Valid formats are: ${Object.values(BookIsbnFormat).join(', ')}.` })
  }),
  value:  z.string().trim().max(MAX_ISBN_LENGTH, `ISBN value cannot exceed ${MAX_ISBN_LENGTH} characters.`),
});

const isbnArraySchema = z.array(bookIsbnSchema)
  .refine(
    (v) => new Set(v.map(i => i.format)).size === v.length,
    { message: 'Each ISBN format must be unique.' }
  )
  .refine(
    (v) => new Set(v.map(i => i.value)).size === v.length,
    { message: 'Each ISBN value must be unique.' }
  )
  .optional();

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

// Create

export const createBookSchema = z.object({
  title: localizedStringSchema,
  subtitle: optionalLocalizedStringSchema,
  description: localizedDescriptionSchema,
  content: localizedContentSchema,
  subject: z.array(localizedStringSchema).default([]),
  authors: z.array(bookAuthorSchema).min(1, 'At least one author is required.'),
  writtenLang: z.enum(BookLanguage, {
    error: (ctx) => ({ message: `Invalid written language '${ctx.input}'. Valid languages are: ${Object.values(BookLanguage).join(', ')}.` })
  }),
  publisher: localizedStringSchema,
  publishedYear: z.number()
    .int('Published year must be an integer.')
    .min(MIN_PUBLISHED_YEAR,   `Published year cannot be before ${MIN_PUBLISHED_YEAR}.`)
    .max(new Date().getFullYear(), 'Published year cannot be in the future.'),

  edition:  z.string().trim().max(MAX_TITLE_LENGTH).optional(),
  isbns:    isbnArraySchema,
  pages:    z.number().int().min(1, 'Pages must be at least 1.').optional(),
  tags:     z.array(z.string().trim()).default([]),

  buyLink:       z.string().trim().optional(),
  featured:     z.boolean().default(false),
  displayOrder: z.number().int().min(0).optional(),
});

// Update

export const updateBookSchema = z.object({
  title:         localizedStringSchema,
  subtitle:      optionalLocalizedStringSchema,
  description: localizedDescriptionSchema,
  content:       localizedContentSchema,
  subject:       z.array(localizedStringSchema),
  authors: z.array(bookAuthorSchema).min(1, 'At least one author is required.'),
  writtenLang:   z.enum(BookLanguage, {
    error: (ctx) => ({ message: `Invalid written language '${ctx.input}'. Valid languages are: ${Object.values(BookLanguage).join(', ')}.` })
  }),
  publisher:     localizedStringSchema,
  publishedYear: z.number()
    .int('Published year must be an integer.')
    .min(MIN_PUBLISHED_YEAR,   `Published year cannot be before ${MIN_PUBLISHED_YEAR}.`)
    .max(new Date().getFullYear(), 'Published year cannot be in the future.'),

  edition:       z.string().trim().max(MAX_TITLE_LENGTH).optional(),
  isbns:         isbnArraySchema,
  pages:    z.number().int().min(1, 'Pages must be at least 1.').optional(),
  tags:     z.array(z.string().trim()),

  buyLink:       z.string().trim().optional(),
  featured:      z.boolean(),
  displayOrder:  z.number().int().min(0).optional(),

  // v defined at same level — never dropped
  v: z.number({ error: 'Version (v) is required and must be a number.' })
     .int('Version must be an integer.')
     .min(0, 'Version cannot be negative.'),
});

// Status update

export const activationBookSchema = z.object({
  status: z.enum(DocumentStatus, {
    error: (ctx) => ({ message: `Invalid status '${ctx.input}'. Valid values are: ${Object.values(DocumentStatus).join(', ')}.` })
  }),
});

// delete preview image

export const deletePreviewImageSchema = z.object({
  url: z.url('Invalid preview image URL.'),
});

// Inferred types — no separate DTO interfaces needed
export type CreateBookDto = z.infer<typeof createBookSchema>;
export type UpdateBookDto = z.infer<typeof updateBookSchema>;
export type ActivationBookDto = z.infer<typeof activationBookSchema>;
export type DeletePreviewImageDto = z.infer<typeof deletePreviewImageSchema>;
