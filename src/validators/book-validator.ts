// src/validators/book.validator.ts
import { z } from 'zod';
import { BookAuthorRole, BookLanguage } from '../enums/book-enums';
import { localizedStringSchema, optionalLocalizedStringSchema } from './common-validator';
import DocumentStatus from '../enums/document-status';

const MAX_TITLE_LENGTH       = 500;
const MAX_DESCRIPTION_LENGTH = 5000;

// Sub-schemas

const bookAuthorSchema = z.object({
  name:       localizedStringSchema,
  role:       z.enum(BookAuthorRole, {
                error: () => ({ message: 'Invalid author role.' })
              }),
  profileUrl: z.string().url('Invalid profile URL.').optional(),
});

// Create

export const createBookSchema = z.object({
  title: localizedStringSchema,
  subtitle: optionalLocalizedStringSchema,
  description: localizedStringSchema.refine(
    data => !data.en || data.en.length <= MAX_DESCRIPTION_LENGTH,
    { message: `English description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.` }
  ),
  content: localizedStringSchema,
  subject: z.array(localizedStringSchema).default([]),
  authors: z.array(bookAuthorSchema).min(1, 'At least one author is required.'),
  writtenLang: z.enum(BookLanguage, {
    error: () => ({ message: 'Invalid written language.' })
  }),
  publisher: localizedStringSchema,
  publishedYear: z.number()
    .int('Published year must be an integer.')
    .min(0,   'Published year cannot be negative.')
    .max(new Date().getFullYear(), 'Published year cannot be in the future.'),

  edition:  z.string().trim().max(MAX_TITLE_LENGTH).optional(),
  isbn:     z.string().trim().max(20, 'ISBN cannot exceed 20 characters.').optional(),
  pages:    z.number().int().min(1, 'Pages must be at least 1.').optional(),
  tags:     z.array(z.string().trim()).default([]),

  coverImage:    z.string().trim().optional(),
  previewImages: z.array(z.string().trim()).default([]),
  buyLink:       z.string().trim().optional(),
  pdfTeaser:     z.string().trim().optional(),

  featured:     z.boolean().default(false),
  displayOrder: z.number().int().min(0).optional(),
});

// Update

export const updateBookSchema = z.object({
  title:         localizedStringSchema.optional(),
  subtitle:      optionalLocalizedStringSchema,
  description:   localizedStringSchema.optional(),
  content:       localizedStringSchema.optional(),
  subject:       z.array(localizedStringSchema).optional(),
  authors:       z.array(bookAuthorSchema).min(1).optional(),
  writtenLang:   z.enum(BookLanguage, {
                   error: () => ({ message: 'Invalid written language.' })
                 }).optional(),
  publisher:     localizedStringSchema.optional(),
  publishedYear: z.number().int().min(0).max(new Date().getFullYear()).optional(),
  edition:       z.string().trim().max(MAX_TITLE_LENGTH).optional(),
  isbn:          z.string().trim().max(20).optional(),
  pages:         z.number().int().min(1).optional(),
  tags:          z.array(z.string().trim()).optional(),
  coverImage:    z.string().trim().optional(),
  previewImages: z.array(z.string().trim()).optional(),
  buyLink:       z.string().trim().optional(),
  pdfTeaser:     z.string().trim().optional(),
  featured:      z.boolean().optional(),
  displayOrder:  z.number().int().min(0).optional(),

  // v defined at same level — never dropped
  v: z.number({ error: 'Version (v) is required and must be a number.' })
     .int('Version must be an integer.')
     .min(0, 'Version cannot be negative.'),
});

// Status update

export const activationBookSchema = z.object({
  status: z.enum(DocumentStatus, {
    error: () => ({ message: 'Invalid status value.' })
  }),
});

// Inferred types — no separate DTO interfaces needed
export type CreateBookDto = z.infer<typeof createBookSchema>;
export type UpdateBookDto = z.infer<typeof updateBookSchema>;
export type ActivationBookDto = z.infer<typeof activationBookSchema>;