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
const MAX_PRICE              = 1_000_000_00 // 1,000,000.00 in cents

export const MAX_BOOK_PREVIEW_IMAGES = 20;

// Sub-schemas

const bookAuthorSchema = z.object({
  name:       localizedStringSchema,
  role:       z.enum(BookAuthorRole, {
                error: (ctx) => ({ message: `Invalid author role '${ctx.input}'. Valid roles are: ${Object.values(BookAuthorRole).join(', ')}.` })
              }),
  profileUrl: z.url('Invalid profile URL.').optional(),
  // id and imageUrl intentionally excluded
});

const bookPublisherSchema = z.object({
  name:     localizedStringSchema,
  address:  localizedStringSchema,
  webUrl:   z.url('Invalid website URL.').optional(),
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

const bookAuthorArraySchema = z.array(bookAuthorSchema)
  .min(1, 'At least one author is required.')
  .refine(
    authors =>{
      const names = authors.map(a =>
        (a.name.en ?? "").trim().toLowerCase()
      );
      return new Set(names).size === names.length;
    },
    {
      message: "Author names must be unique.",
    }
  );

const bookPriceSchema = z.object({
  amount: z.number()
    .int('Amount must be an integer.')
    .min(0, `Amount cannot be negative.`)
    .max(MAX_PRICE, `Amount cannot exceed ${MAX_PRICE}`),
  currency: z.string().trim()
    .transform(v => v.toUpperCase())
    .pipe(
      z.string()
        .length(3, 'Currency code must be exactly 3 characters.')
        .regex(/^[A-Z]{3}$/, 'Currency code must be valid ISO 4217 code (e.g. LKR, USD).')
    ),
}).optional();

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
  authors: bookAuthorArraySchema,
  writtenLang: z.enum(BookLanguage, {
    error: (ctx) => ({ message: `Invalid written language '${ctx.input}'. Valid languages are: ${Object.values(BookLanguage).join(', ')}.` })
  }),
  publisher: bookPublisherSchema,
  publishedYear: z.number()
    .int('Published year must be an integer.')
    .min(MIN_PUBLISHED_YEAR,   `Published year cannot be before ${MIN_PUBLISHED_YEAR}.`)
    .max(new Date().getFullYear(), 'Published year cannot be in the future.'),

  edition:  z.string().trim().max(MAX_TITLE_LENGTH).optional(),
  isbns:    isbnArraySchema,
  pages:    z.number().int().min(1, 'Pages must be at least 1.').optional(),
  tags:     z.array(z.string().trim()).default([]),
  price:    bookPriceSchema,

  buyLink:       z.string().trim().optional(),
  featured:     z.boolean().default(false),
  displayOrder: z.number().int().min(0).optional(),
});

// Update

const updateBookAuthorSchema = z.object({
  id:         z.string().trim().min(1, 'Author ID is required.').optional(), // absent = new author
  name:       localizedStringSchema,
  role:       z.enum(BookAuthorRole, {
                error: (ctx) => ({ message: `Invalid author role '${ctx.input}'. Valid roles are: ${Object.values(BookAuthorRole).join(', ')}.` })
              }),
  profileUrl: z.url('Invalid profile URL.').optional(),
  // imageUrl intentionally excluded — handled via separate upload endpoint
});

const updateBookAuthorArraySchema = z.array(updateBookAuthorSchema)
  .min(1, 'At least one author is required.')
  .refine(
    authors =>{
      const names = authors.map(a =>
        (a.name.en ?? "").trim().toLowerCase()
      );
      return new Set(names).size === names.length;
    },
    {
      message: "Author names must be unique.",
    }
  );

const updateBookPreviewImageSchema = z.object({
  id:           z.string(),
  caption:      optionalLocalizedStringSchema,
  displayOrder: z.number(),
});

export const updateBookSchema = z.object({
  title:         localizedStringSchema,
  subtitle:      optionalLocalizedStringSchema,
  description:   localizedDescriptionSchema,
  content:       localizedContentSchema,
  subject:       z.array(localizedStringSchema),
  authors:       updateBookAuthorArraySchema,
  writtenLang:   z.enum(BookLanguage, {
    error: (ctx) => ({ message: `Invalid written language '${ctx.input}'. Valid languages are: ${Object.values(BookLanguage).join(', ')}.` })
  }),
  publisher:     bookPublisherSchema,
  publishedYear: z.number()
    .int('Published year must be an integer.')
    .min(MIN_PUBLISHED_YEAR, `Published year cannot be before ${MIN_PUBLISHED_YEAR}.`)
    .max(new Date().getFullYear(), 'Published year cannot be in the future.'),

  edition: z.string().trim().max(MAX_TITLE_LENGTH).optional(),
  isbns:   isbnArraySchema,
  pages:   z.number().int().min(1, 'Pages must be at least 1.').optional(),
  tags:    z.array(z.string().trim()),
  price:    bookPriceSchema,

  buyLink:       z.string().trim().optional(),
  featured:      z.boolean(),
  displayOrder:  z.number().int().min(0).optional(),
  previewImages: z.array(updateBookPreviewImageSchema).optional(),

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

export const reorderPreviewImagesSchema = z.object({
  ids: z.array(
    z.string().trim().min(1, 'Preview image ID cannot be empty.')
  ).min(1, 'At least one preview image ID is required.'),
});

// Inferred types — no separate DTO interfaces needed
export type CreateBookDto = z.infer<typeof createBookSchema>;
export type UpdateBookDto = z.infer<typeof updateBookSchema>;
export type ActivationBookDto = z.infer<typeof activationBookSchema>;
export type ReorderPreviewImagesDto = z.infer<typeof reorderPreviewImagesSchema>;
