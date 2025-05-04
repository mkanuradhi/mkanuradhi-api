import { model, Schema } from "mongoose";
import DocumentStatus from "../enums/document-status";
import AppError from "../errors/app-error";
import PublicationDocument from "../documents/publication-document";
import PublicationType from "../enums/publication-type";

const MIN_YEAR = 2010;
const MAX_YEAR = 2040;

const MIN_DESCRIPTION_LENGTH = 10;
const MAX_DESCRIPTION_LENGTH = 1000;

const MAX_BIBTEX_LENGTH = 1000;

const MAX_COMMON_LENGTH = 300;

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
    description: {
      type: String,
      trim: true,
      unique: true,
      required: [true, 'Description is required.'],
      minLength: [MIN_DESCRIPTION_LENGTH, `Publication description must be minimum ${MIN_DESCRIPTION_LENGTH} characters long.`],
      maxLength: [MAX_DESCRIPTION_LENGTH, `Publication description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`]
    },
    url: {
      type: String,
      trim: true,
      maxLength: [MAX_COMMON_LENGTH, `URL cannot exceed ${MAX_COMMON_LENGTH} characters.`]
    },
    venue: {
      type: String,
      trim: true,
      maxLength: [MAX_COMMON_LENGTH, `Venue cannot exceed ${MAX_COMMON_LENGTH} characters.`]
    },
    bibtex: {
      type: String,
      trim: true,
      maxLength: [MAX_BIBTEX_LENGTH, `Bibtex cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`]
    },
    status: {
      type: String,
      enum: {
        values: Object.values(DocumentStatus),
        message: 'Publication status `{VALUE}` is not valid.',
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
publicationSchema.index({ description: 'text', venue: 'text' });

const PublicationModel = model<PublicationDocument>('Publication', publicationSchema);

export default PublicationModel;
