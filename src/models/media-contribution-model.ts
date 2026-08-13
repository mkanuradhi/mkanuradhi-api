import { model, Schema } from "mongoose";
import { MediaContributionAuthor, MediaContributionInterviewer, MediaContributionOutlet, MediaContributionPreviewImage } from "../interfaces/i-media-contribution";
import { localizedStringSchema } from "./localized-string-schema";
import AppUserSchema from "./app-user-schema";
import DocumentStatus from "../enums/document-status";
import MediaContributionDocument from "../documents/media-contribution-document";
import { MEDIA_CONTRIBUTION_LANGUAGES, MEDIA_CONTRIBUTION_ROLES, MEDIA_CONTRIBUTION_TYPES } from "../enums/media-contribution-enums";

const MAX_TITLE_LENGTH = 500;
const MAX_PATH_LENGTH = MAX_TITLE_LENGTH + 10; // number length

const mediaContributionAuthorSchema = new Schema<MediaContributionAuthor>(
  {
    id: {
      type:     String,
      required: [true, "Author ID is required."],
    },
    name: {
      type: localizedStringSchema,
      required: [true, "Author name is required."],
    },
    isMe: {
      type: Boolean,
      required: false,
      default: false,
    },
    profileUrl: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type:     String,
      required: false,
      trim:     true,
    },
  }, {
    _id: false,
  }
);

const mediaContributionInterviewerSchema = new Schema<MediaContributionInterviewer>(
  {
    id: {
      type:     String,
      required: [true, "Author ID is required."],
    },
    name: {
      type: localizedStringSchema,
      required: [true, "Author name is required."],
    },
    profileUrl: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type:     String,
      required: false,
      trim:     true,
    },
  }, {
    _id: false,
  }
);

const mediaContributionOutletSchema = new Schema<MediaContributionOutlet>(
  {
    name: {
      type: localizedStringSchema,
      required: [true, "Publisher name is required."],
    },
    webUrl: {
      type: String,
      required: false,
      trim: true,
    },
    imageUrl: {
      type:     String,
      required: false,
      trim:     true,
    },
  }, {
    _id: false, // no separate _id — it's embedded, not a collection
  }
);

const previewImageSchema = new Schema<MediaContributionPreviewImage>(
  {
    id: {
      type:     String,
      required: [true, "Preview image ID is required."],
    },
    url: {
      type:     String,
      required: [true, "Preview image URL is required."],
      trim:     true,
    },
    displayOrder: {
      type:    Number,
      default: 0,
      min:     [0, "Display order cannot be negative."],
    },
  },
  { _id: false }
);

const mediaContributionSchema = new Schema<MediaContributionDocument>(
  {
    title: {
      type: localizedStringSchema,
      required: [true, "Media contribution title is required."],
    },
    titleOriginal: {
      type: String,
      trim: true,
      maxLength: [MAX_TITLE_LENGTH, `Original title cannot exceed ${MAX_TITLE_LENGTH} characters.`],
      required: [true, "Original title is required."],
    },
    subtitle: {
      type: localizedStringSchema,
      required: false
    },
    subtitleOriginal: {
      type: String,
      trim: true,
      required: false
    },
    description: {
      type: localizedStringSchema,
      required: [true, "Media contribution description is required."],
    },
    content: {
      type: localizedStringSchema,
      required: false,
    },
    type: {
      type: String,
      enum: {
        values: MEDIA_CONTRIBUTION_TYPES,
        message: 'Media contribution type `{VALUE}` is not valid.',
      },
      required: true,
    },
    role: {
      type: String,
      enum: {
        values: MEDIA_CONTRIBUTION_ROLES,
        message: 'Media contribution role `{VALUE}` is not valid.',
      },
      required: true,
    },
    topics: {
      type: [localizedStringSchema],
      default: [],
    },
    authors: {
      type: [mediaContributionAuthorSchema],
      default: [],
      required: false,
    },
    language: {
      type: String,
      enum: {
        values: MEDIA_CONTRIBUTION_LANGUAGES,
        message: 'Media contribution language `{VALUE}` is not valid.',
      },
      required: [true, "Language is required."],
    },
    interviewers: {
      type: [mediaContributionInterviewerSchema],
      default: [],
      required: false,
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
    outlet: {
      type: mediaContributionOutletSchema,
      required: false,
    },
    publishedDate: {
      type: Date,
      required: [true, "Published date is required."],
      max: [new Date(), "Published date cannot be in the future."],
    },
    durationSeconds: {
      type: Number,
      required: false,
      min: [0, "Duration cannot be negative."],
    },
    highlightQuote: {
      type: localizedStringSchema,
      required: false,
    },
    coverImage: {
      type: String,
      trim: true,
      required: false,
    },
    previewImages: {
      type: [previewImageSchema],
      default: []
    },
    pdfLink: {
      type: String,
      trim: true,
      required: false,
    },
    sourceUrl: {
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
        message: 'Media contribution status `{VALUE}` is not valid.',
      },
      default: DocumentStatus.INACTIVE,
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

// Main listing query: active, non-deleted, sorted by date desc
mediaContributionSchema.index({ status: 1, deleted: 1, publishedDate: -1 });

// Filtering by type (once you add TV/podcast and want a type filter)
mediaContributionSchema.index({ type: 1, publishedDate: -1 });

// Featured section on homepage
mediaContributionSchema.index({ featured: 1, displayOrder: 1 });

const MediaContributionModel = model<MediaContributionDocument>("MediaContribution", mediaContributionSchema);

export default MediaContributionModel;

