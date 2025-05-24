import { model, Schema } from "mongoose";
import DocumentStatus from "../enums/document-status";
import AppError from "../errors/app-error";
import PublicationDocument from "../documents/publication-document";
import PublicationType from "../enums/publication-type";
import PublicationStatus from "../enums/publication-status";

const MIN_YEAR = 2010;
const MAX_YEAR = 2040;

const MIN_TITLE_LENGTH = 5;
const MAX_TITLE_LENGTH = 350;

const MAX_SOURCE_LENGTH = 2000;

const MAX_URL_LENGTH = 400;

const MAX_ABSTRACT_LENGTH = 5000;
const MAX_BIBTEX_LENGTH = 5000;

const safeTrim = (value: unknown): string | undefined => {
  return typeof value === 'string' ? value.trim() : undefined;
};

const publicationAuthorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    isMe: { type: Boolean, required: true },
  },
  { _id: false }
);

const publicationSchema = new Schema<PublicationDocument>(
  {
    type: {
      type: String,
      enum: {
        values: Object.values(PublicationType),
        message: 'Publication type `{VALUE}` is not valid.',
      },
      required: [true, 'Publication type is required.']
    },
    year: {
      type: Number,
      required: [true, 'Year is required.'],
      min: [MIN_YEAR, `Year must be a valid year greater than ${MIN_YEAR}`],
      max: [MAX_YEAR, `Year must be a valid year less than ${MAX_YEAR}`]
    },
    title: {
      type: String,
      required: [true, 'Title is required.'],
      trim: true,
      minLength: [MIN_TITLE_LENGTH, `Publication title must be minimum ${MIN_TITLE_LENGTH} characters long.`],
      maxLength: [MAX_TITLE_LENGTH, `Publication title cannot exceed ${MAX_TITLE_LENGTH} characters.`]
    },
    source: {
      type: String,
      set: safeTrim,
      maxLength: [MAX_SOURCE_LENGTH, `Publication source cannot exceed ${MAX_SOURCE_LENGTH} characters.`]
    },
    authors: {
      type: [publicationAuthorSchema],
      default: [],
    },
    publicationStatus: {
      type: String,
      enum: {
        values: Object.values(PublicationStatus),
        message: 'Publication status `{VALUE}` is not valid.',
      },
      required: [true, 'Publication status is required.']
    },
    tags: {
      type: [String],
      set: (tags?: string[]): string[] => {
        if (!Array.isArray(tags)) return [];
        return tags
          .filter((t): t is string => typeof t === 'string')
          .map(t => t.trim());
      },
      default: [],
    },
    publicationUrl: {
      type: String,
      set: safeTrim,
      maxLength: [MAX_URL_LENGTH, `Publication URL cannot exceed ${MAX_URL_LENGTH} characters.`]
    },
    pdfUrl: {
      type: String,
      set: safeTrim,
      maxLength: [MAX_URL_LENGTH, `PDF URL cannot exceed ${MAX_URL_LENGTH} characters.`]
    },
    doiUrl: {
      type: String,
      set: safeTrim,
      maxLength: [MAX_URL_LENGTH, `DOI URL cannot exceed ${MAX_URL_LENGTH} characters.`]
    },
    preprintUrl: {
      type: String,
      set: safeTrim,
      maxLength: [MAX_URL_LENGTH, `Preprint URL cannot exceed ${MAX_URL_LENGTH} characters.`]
    },
    abstract: {
      type: String,
      trim: safeTrim,
      maxlength: [MAX_ABSTRACT_LENGTH, `Abstract cannot exceed ${MAX_ABSTRACT_LENGTH} characters.`]
    },
    bibtex: {
      type: String,
      set: safeTrim,
      maxLength: [MAX_BIBTEX_LENGTH, `Bibtex cannot exceed ${MAX_BIBTEX_LENGTH} characters.`]
    },
    status: {
      type: String,
      enum: {
        values: Object.values(DocumentStatus),
        message: 'Document status `{VALUE}` is not valid.',
      },
      default: DocumentStatus.ACTIVE,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: '__v'
  }
);

publicationSchema.set('toJSON', { virtuals: true });
publicationSchema.set('toObject', { virtuals: true });

publicationSchema.pre('validate', async function (next) {
  // validate status
  if (!Object.values(DocumentStatus).includes(this.status)) {
    next(
      new AppError(`Invalid status: '${this.status}'. Allowed values are: ${Object.values(DocumentStatus).join(', ')}.`, 400)
    );
  }

  next();
});

publicationSchema.index({ type: 1, year: -1 });
publicationSchema.index({ title: 'text', source: 'text' });

const PublicationModel = model<PublicationDocument>('Publication', publicationSchema);

export default PublicationModel;
