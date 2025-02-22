import { model, Schema } from "mongoose";
import DocumentStatus from "../enums/document-status";
import BlogPostDocument from "../documents/blog-post-document";
import AppError from "../errors/app-error";

const MIN_TITLE_LENGTH = 3;
const MAX_TITLE_LENGTH = 100;

const MIN_SUMMARY_LENGTH = 30;
const MAX_SUMMARY_LENGTH = 400;

const MIN_CONTENT_LENGTH = 50;
const MAX_CONTENT_LENGTH = 5000;

const MIN_DESCRIPTION_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 160;

const blogPostSchema = new Schema<BlogPostDocument>(
  {
    titleEn: {
      type: String,
      trim: true,
      unique: true,
      required: [true, 'Blog title in English is required.'],
      minLength: [MIN_TITLE_LENGTH, `Blog title in English must be minimum ${MIN_TITLE_LENGTH} characters long.`],
      maxLength: [MAX_TITLE_LENGTH, `Blog title in English cannot exceed ${MAX_TITLE_LENGTH} characters.`]
    },
    summaryEn: {
      type: String,
      trim: true,
      required: [true, 'Summary in English is required.'],
      minLength: [MIN_SUMMARY_LENGTH, `Summary in English must be minimum ${MIN_SUMMARY_LENGTH} characters long.`],
      maxLength: [MAX_SUMMARY_LENGTH, `Summary in English cannot exceed ${MAX_SUMMARY_LENGTH} characters.`],
    },
    contentEn: {
      type: String,
      trim: true,
      required: [true, "Content in English is required."],
      minLength: [MIN_CONTENT_LENGTH, `Content in English must be minimum ${MIN_CONTENT_LENGTH} characters long.`],
      maxLength: [MAX_CONTENT_LENGTH, `Content in English cannot exceed ${MAX_CONTENT_LENGTH} characters.`],
    },
    pageDescriptionEn: {
      type: String,
      trim: true,
      required: [true, "Page description in English is required."],
      minLength: [MIN_DESCRIPTION_LENGTH, `Page description in English must be minimum ${MIN_DESCRIPTION_LENGTH} characters long.`],
      maxLength: [MAX_DESCRIPTION_LENGTH, `Page description in English cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`],
    },
    titleSi: {
      type: String,
      trim: true,
      unique: true,
      minLength: [MIN_TITLE_LENGTH, `Blog title in Sinhala must be minimum ${MIN_TITLE_LENGTH} characters long.`],
      maxLength: [MAX_TITLE_LENGTH, `Blog title in Sinhala cannot exceed ${MAX_TITLE_LENGTH} characters.`],
    },
    summarySi: {
      type: String,
      trim: true,
      minLength: [MIN_SUMMARY_LENGTH, `Summary in Sinhala must be minimum ${MIN_SUMMARY_LENGTH} characters long.`],
      maxLength: [MAX_SUMMARY_LENGTH, `Summary in Sinhala cannot exceed ${MAX_SUMMARY_LENGTH} characters.`],
    },
    contentSi: {
      type: String,
      trim: true,
      minLength: [MIN_CONTENT_LENGTH, `Content in Sinhala must be minimum ${MIN_CONTENT_LENGTH} characters long.`],
      maxLength: [MAX_CONTENT_LENGTH, `Content in Sinhala cannot exceed ${MAX_CONTENT_LENGTH} characters.`],
    },
    pageDescriptionSi: {
      type: String,
      trim: true,
      minLength: [MIN_DESCRIPTION_LENGTH, `Page description in Sinhala must be minimum ${MIN_DESCRIPTION_LENGTH} characters long.`],
      maxLength: [MAX_DESCRIPTION_LENGTH, `Page description in Sinhala cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`],
    },
    primaryImage: {
      type: String,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    path: {
      type: String,
      trim: true,
      unique: true,
      required: [true, 'Path is required.'],
      minLength: [3, 'Path must be present.'],
      maxLength: [MAX_TITLE_LENGTH, `Path cannot exceed ${MAX_TITLE_LENGTH} characters.`],
      match: [/^[a-z0-9\-]+$/, 'Path must be URL-safe (lowercase letters, numbers, hyphens).'],
    },
    status: {
      type: String,
      enum: {
        values: Object.values(DocumentStatus),
        message: 'Blog post status `{VALUE}` is not valid.',
      },
      default: DocumentStatus.ACTIVE,
    },
    keywords: {
      type: [String],
      default: [],
    },
    dateTime: {
      type: Date,
      required: [true, "Date and time is required."],
      trim: true,
    },
    published: {
      type: Boolean,
      default: false,
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

blogPostSchema.set('toJSON', { virtuals: true });
blogPostSchema.set('toObject', { virtuals: true });

blogPostSchema.pre('validate', async function (next) {
  if (this.path) {
    this.path = this.path
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
      .replace(/-+/g, '-');
  } else if (this.titleEn) {
    this.path = this.titleEn
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
      .replace(/-+/g, '-');
  }
  // Check for uniqueness and modify path if necessary
  let uniquePath = this.path;
  let counter = 1;

  while (await BlogPostModel.exists({ path: uniquePath, _id: { $ne: this._id } })) {
    uniquePath = `${this.path}-${counter}`;
    counter++;
  }

  this.path = uniquePath;

  // validate status
  if (!Object.values(DocumentStatus).includes(this.status)) {
    next(
      new AppError(`Invalid status: '${this.status}'. Allowed values are: ${Object.values(DocumentStatus).join(', ')}.`, 400)
    );
  }

  next();
});

blogPostSchema.index({ titleEn: "text", summaryEn: "text", contentEn: "text", titleSi: "text", summarySi: "text", contentSi: "text" }); // For text search
blogPostSchema.index({ createdAt: -1 }); // For recent posts

const BlogPostModel = model<BlogPostDocument>('BlogPost', blogPostSchema);

export default BlogPostModel;
