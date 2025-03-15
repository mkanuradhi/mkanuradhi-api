import { model, Schema } from "mongoose";
import CourseDocument from "../documents/course-document";
import { sanitizeString } from "../utils/common-util";
import DocumentStatus from "../enums/document-status";
import DeliveryMode from "../enums/delivery-mode";

const MAX_CODE_LENGTH = 20;
const MAX_TITLE_LENGTH = 150;
const MAX_PATH_LENGTH = MAX_CODE_LENGTH + MAX_TITLE_LENGTH + 4 + 5; // year length + dashes length
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_LOCATION_LENGTH = 200;

const courseQuizSchema = new Schema(
  {
    id: { type: Schema.Types.ObjectId, required: true },
    titleEn: { type: String, required: true, trim: true },
    titleSi: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const courseSchema = new Schema<CourseDocument>(
  {
    year: {
      type: Number,
      required: [true, "Year is required."],
      min: [2010, "Year must be a valid four-digit number."],
      max: [2050, "Year must be a valid year."]
    },
    code: {
      type: String,
      trim: true,
      maxLength: [MAX_CODE_LENGTH, `Course code cannot exceed ${MAX_CODE_LENGTH} characters.`],
    },
    credits: {
      type: Number,
      min: [1, "Credits must be at least 1."],
      max: [30, "Credits must be less than 30."]
    },
    mode: {
      type: String,
      enum: {
        values: Object.values(DeliveryMode),
        message: 'Course delivery mode `{VALUE}` is not valid.',
      },
      default: DeliveryMode.PHYSICAL,
    },
    titleEn: {
      type: String,
      required: [true, "Course title in English is required."],
      trim: true,
      maxLength: [MAX_TITLE_LENGTH, `Title in English cannot exceed ${MAX_TITLE_LENGTH} characters.`],
    },
    subtitleEn: {
      type: String,
      trim: true,
      maxLength: [MAX_TITLE_LENGTH, `Subtitle in English cannot exceed ${MAX_TITLE_LENGTH} characters.`],
    },
    descriptionEn: {
      type: String,
      trim: true,
      maxLength: [MAX_DESCRIPTION_LENGTH, `Description in English cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`],
    },
    locationEn: {
      type: String,
      required: [true, "Location in English is required."],
      trim: true,
      maxLength: [MAX_LOCATION_LENGTH, `Location in English cannot exceed ${MAX_LOCATION_LENGTH} characters.`],
    },
    titleSi: {
      type: String,
      trim: true,
      maxLength: [MAX_TITLE_LENGTH, `Title in Sinhala cannot exceed ${MAX_TITLE_LENGTH} characters.`],
    },
    subtitleSi: {
      type: String,
      trim: true,
      maxLength: [MAX_TITLE_LENGTH, `Subtitle in Sinhala cannot exceed ${MAX_TITLE_LENGTH} characters.`],
    },
    descriptionSi: {
      type: String,
      trim: true,
      maxLength: [MAX_DESCRIPTION_LENGTH, `Description in Sinhala cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`],
    },
    locationSi: {
      type: String,
      trim: true,
      maxLength: [MAX_LOCATION_LENGTH, `Location in Sinhala cannot exceed ${MAX_LOCATION_LENGTH} characters.`],
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
    quizzes: {
      type: [courseQuizSchema],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: Object.values(DocumentStatus),
        message: 'Course status `{VALUE}` is not valid.',
      },
      default: DocumentStatus.INACTIVE,
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

courseSchema.pre('validate', async function (next) {
  if (this.path) {
    this.path = sanitizeString(this.path);
  } else if (this.titleEn) {
    const sanitizedTitle = sanitizeString(this.titleEn);
    if (this.code) {
      const sanitizedCode = sanitizeString(this.code);
      this.path = `${sanitizedCode}-${sanitizedTitle}-${this.year}`;
    } else {
      this.path = `${sanitizedTitle}-${this.year}`;
    }
  }
  // Check for uniqueness and modify path if necessary
  let uniquePath = this.path;
  let counter = 1;

  while (await CourseModel.exists({ path: uniquePath, _id: { $ne: this._id } })) {
    uniquePath = `${this.path}-${counter}`;
    counter++;
  }

  this.path = uniquePath;

  next();
});

courseSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as Record<string, any>;

  const updatedFields = update.$set || update;

  // If user explicitly provides a new path, do nothing.
  if (updatedFields.path) {
    return next();
  }

  // Determine if any fields that affect the path are being updated.
  if (updatedFields.titleEn || updatedFields.code || updatedFields.year) {
    // Fetch the current document values to fill in any missing fields.
    const doc = await this.model.findOne(this.getQuery());

    if (!doc) {
      return next(new Error("Document not found during update."));
    }

    // Use the updated values if provided, otherwise fallback to the current document values.
    const newTitle = updatedFields.titleEn ? sanitizeString(updatedFields.titleEn) : sanitizeString(doc.titleEn);
    const newCode = updatedFields.code ? sanitizeString(updatedFields.code) : (doc.code ? sanitizeString(doc.code) : '');
    const newYear = updatedFields.year || doc.year;

    // Build the new path
    let newPath = newCode ? `${newCode}-${newTitle}-${newYear}` : `${newTitle}-${newYear}`;

    // Ensure uniqueness by appending a counter if necessary.
    let uniquePath = newPath;
    let counter = 1;
    while (await this.model.exists({ path: uniquePath, _id: { $ne: doc._id } })) {
      uniquePath = `${newPath}-${counter}`;
      counter++;
    }

    updatedFields.path = uniquePath;
    this.setUpdate(updatedFields);
  }
  next();
});

courseSchema.index({ code: 1 }, { sparse: true });
courseSchema.index({ titleEn: 1 });
courseSchema.index({ titleSi: 1 }, { sparse: true });
courseSchema.index(
  { year: "text",
    code: "text",
    titleEn: "text",
    descriptionEn: "text",
    locationEn: "text",
    titleSi: "text",
    descriptionSi: "text",
    locationSi: "text",
  }
); // For text search

const CourseModel = model<CourseDocument>("Course", courseSchema);

export default CourseModel;
