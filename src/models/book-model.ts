import { model, Schema } from "mongoose";
import BookDocument from "../documents/book-document";
import AppUserSchema from "./app-user-schema";
import { BookAuthor, BookIsbn } from "../interfaces/i-book";
import { localizedStringSchema } from "./localized-string-schema";
import { BookAuthorRole, BookIsbnFormat, BookLanguage } from "../enums/book-enums";
import DocumentStatus from "../enums/document-status";

const MAX_TITLE_LENGTH = 500;
const MAX_PATH_LENGTH = MAX_TITLE_LENGTH + 10; // number length
const MAX_ISBN_LENGTH  = 20;   // ISBN-13 with hyphens: 978-XXX-XXXX-XX-X
const MAX_ISBNS        = Object.values(BookIsbnFormat).length; // one per format at most

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

const bookIsbnSchema = new Schema<BookIsbn>(
  {
    format: {
      type: String,
      enum: {
        values: Object.values(BookIsbnFormat),
        message: 'ISBN format `{VALUE}` is not valid.',
      },
      required: [true, "ISBN format is required."],
    },
    value: {
      type: String,
      trim: true,
      required: [true, "ISBN value is required."],
      maxlength: [MAX_ISBN_LENGTH, `ISBN cannot exceed ${MAX_ISBN_LENGTH} characters.`],
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
    isbns: {
      type: [bookIsbnSchema],
      default: [],
      validate: {
        validator: (v: BookIsbn[]) => {
          if (v.length > MAX_ISBNS) return false;
          // each format can appear only once
          const formats = v.map(i => i.format);
          const values  = v.map(i => i.value);
          return new Set(formats).size === formats.length  // unique formats
            && new Set(values).size  === values.length;  // unique values
        },
        message: "Each ISBN format and value must be unique.",
      },
    },
    pages: {
      type: Number,
      min: [1, "Pages must be at least 1."],
    },
    tags: {
      type: [String],
      default: [],
    },
    coverImage: {
      type: String,
      trim: true,
      required: false,
    },
    previewImages: {
      type: [String],
      default: []
    },
    buyLink: {
      type: String,
      trim: true,
      required: false,
    },
    pdfTeaser: {
      type: String,
      trim: true,
      required: false,
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
