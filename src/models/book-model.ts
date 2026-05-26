import { model, Schema } from "mongoose";
import BookDocument from "../documents/book-document";
import AppUserSchema from "./app-user-schema";
import { BookAuthor } from "../interfaces/i-book";
import { localizedStringSchema } from "./localized-string-schema";
import { BookAuthorRole, BookLanguage } from "../enums/book-enums";
import DocumentStatus from "../enums/document-status";

const MAX_TITLE_LENGTH = 500;
const MAX_PATH_LENGTH = MAX_TITLE_LENGTH + 10; // number length

const bookAuthorSchema = new Schema<BookAuthor>(
  {
    name: {
      type: localizedStringSchema,
      required: [true, "Author name is required."],
    },
    role: {
      type: String,
      enum: {
        values: Object.values(BookAuthorRole),
        message: 'Author role `{VALUE}` is not valid.',
      },
      required: [true, "Author role is required."],
    },
    profileUrl: {
      type: String,
      trim: true,
    },
  }, {
    _id: false, // no separate _id — it's embedded, not a collection
  }
);

const bookSchema = new Schema<BookDocument>(
  {
    title: {
      type: localizedStringSchema,
      required: [true, "Book title is required."],
    },
    subtitle: {
      type: localizedStringSchema,
      required: false
    },
    description: {
      type: localizedStringSchema,
      required: [true, "Book description is required."],
    },
    content: {
      type: localizedStringSchema,
      required: [true, "Book content is required."],
    },
    subject: {
      type: [localizedStringSchema],
      default: []
    },
    authors: {
      type: [bookAuthorSchema],
      default: [],
      validate: {
        validator: function (v: BookAuthor[]) {
          return v.length > 0; // at least one author
        },
        message: "At least one author is required."
      }
    },
    writtenLang: {
      type: String,
      enum: {
        values: Object.values(BookLanguage),
        message: 'Book written language `{VALUE}` is not valid.',
      },
      required: [true, "Written language is required."],
    },
    path: {
      type: String,
      trim: true,
      unique: true,
      required: [true, 'Path is required.'],
      minLength: [3, 'Path must be present.'],
      maxLength: [MAX_PATH_LENGTH, `Path cannot exceed ${MAX_PATH_LENGTH} characters.`],
      match: [/^[a-z0-9\-]+$/, 'Path must be URL-safe (lowercase letters, numbers, hyphens).'],
    },
    publisher: {
      type: localizedStringSchema,
      required: [true, "Publisher is required."],
    },
    publishedYear: {
      type: Number,
      required: [true, "Published year is required."],
      min: [0, "Published year cannot be negative."],
      max: [new Date().getFullYear(), "Published year cannot be in the future."],
    },
    edition: {
      type: String,
      trim: true,
      maxLength: [MAX_TITLE_LENGTH, `Edition cannot exceed ${MAX_TITLE_LENGTH} characters.`],
    },
    isbn: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // allows multiple docs without ISBN
      maxLength: [20, "ISBN cannot exceed 20 characters."],
    },
    pages: {
      type: Number,
      min: [1, "Pages must be at least 1."],
    },
    tags: {
      type: [String],
      default: []
    },
    coverImage: {
      type: String,
      trim: true,
    },
    previewImages: {
      type: [String],
      default: []
    },
    buyLink: {
      type: String,
      trim: true,
    },
    pdfTeaser: {
      type: String,
      trim: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    displayOrder: {
      type: Number,
      min: [0, "Display order cannot be negative."],
    },
    status: {
      type: String,
      enum: {
        values: Object.values(DocumentStatus),
        message: 'Book status `{VALUE}` is not valid.',
      },
      default: DocumentStatus.ACTIVE,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    createdBy: { type: AppUserSchema, required: false },
    updatedBy: { type: AppUserSchema, required: false },
  },
  {
    timestamps: true,
  }
);

bookSchema.index(
  { 'title.en': 1 },
  {
    unique: true,
    sparse: true,   // sparse = documents without title.en are excluded from index
    collation: { locale: 'en', strength: 2 },  // case-insensitive
  }
);

const BookModel = model<BookDocument>("Book", bookSchema);

export default BookModel;
