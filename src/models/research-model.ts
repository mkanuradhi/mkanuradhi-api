import { model, Schema } from "mongoose";
import DocumentStatus from "../enums/document-status";
import AppError from "../errors/app-error";
import ResearchDocument from "../documents/research-document";
import DegreeType from "../enums/degree-type";
import SupervisionStatus from "../enums/supervision-status";
import SupervisorRole from "../enums/supervisor-role";

const MIN_YEAR = 2010;
const MAX_YEAR = 2040;

const MIN_TITLE_LENGTH = 5;
const MAX_TITLE_LENGTH = 350;

const MAX_LOCATION_LENGTH = 2000;

const MAX_URL_LENGTH = 400;

const MAX_ABSTRACT_LENGTH = 5000;

const safeTrim = (value: unknown): string | undefined => {
  return typeof value === 'string' ? value.trim() : undefined;
};

const researchSupervisorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    affiliation: { type: String, required: false, trim: true },
    profileUrl: { type: String, required: false, trim: true },
    isMe: { type: Boolean, required: true },
    role: {
      type: String,
      enum: {
        values: Object.values(SupervisorRole),
        message: 'Supervisor role `{VALUE}` is not valid.',
      },
      required: true
    },
  },
  { _id: false }
);

const researchSchema = new Schema<ResearchDocument>(
  {
    type: {
      type: String,
      enum: {
        values: Object.values(DegreeType),
        message: 'Degree type `{VALUE}` is not valid.',
      },
      required: [true, 'Degree type is required.']
    },
    degree: {
      type: String,
      required: [true, 'Degree is required.'],
      trim: true,
      minLength: [MIN_TITLE_LENGTH, `Degree must be minimum ${MIN_TITLE_LENGTH} characters long.`],
      maxLength: [MAX_TITLE_LENGTH, `Degree cannot exceed ${MAX_TITLE_LENGTH} characters.`]
    },
    completedYear: {
      type: Number,
      min: [MIN_YEAR, `Completed year must be a valid year greater than ${MIN_YEAR}`],
      max: [MAX_YEAR, `Completed year must be a valid year less than ${MAX_YEAR}`]
    },
    title: {
      type: String,
      required: [true, 'Title is required.'],
      trim: true,
      minLength: [MIN_TITLE_LENGTH, `Research title must be minimum ${MIN_TITLE_LENGTH} characters long.`],
      maxLength: [MAX_TITLE_LENGTH, `Research title cannot exceed ${MAX_TITLE_LENGTH} characters.`]
    },
    location: {
      type: String,
      set: safeTrim,
      maxLength: [MAX_LOCATION_LENGTH, `Location cannot exceed ${MAX_LOCATION_LENGTH} characters.`]
    },
    abstract: {
      type: String,
      set: safeTrim,
      maxlength: [MAX_ABSTRACT_LENGTH, `Abstract cannot exceed ${MAX_ABSTRACT_LENGTH} characters.`]
    },
    supervisors: {
      type: [researchSupervisorSchema],
      default: [],
    },
    keywords: {
      type: [String],
      set: (keywords?: string[]): string[] => {
        if (!Array.isArray(keywords)) return [];
        return keywords
          .filter((t): t is string => typeof t === 'string')
          .map(t => t.trim());
      },
      default: [],
    },
    thesisUrl: {
      type: String,
      set: safeTrim,
      maxLength: [MAX_URL_LENGTH, `Thesis URL cannot exceed ${MAX_URL_LENGTH} characters.`]
    },
    githubUrl: {
      type: String,
      set: safeTrim,
      maxLength: [MAX_URL_LENGTH, `GitHub URL cannot exceed ${MAX_URL_LENGTH} characters.`]
    },
    slidesUrl: {
      type: String,
      set: safeTrim,
      maxLength: [MAX_URL_LENGTH, `Slides URL cannot exceed ${MAX_URL_LENGTH} characters.`]
    },
    studentName: {
      type: String,
      set: safeTrim,
      maxLength: [MAX_TITLE_LENGTH, `Student name cannot exceed ${MAX_TITLE_LENGTH} characters.`]
    },
    supervisionStatus: {
      type: String,
      enum: {
        values: Object.values(SupervisionStatus),
        message: 'Supervision status `{VALUE}` is not valid.',
      },
      required: [true, 'Supervision status is required.']
    },
    registrationNumber: {
      type: String,
      set: safeTrim,
      maxLength: [MAX_TITLE_LENGTH, `Registration number cannot exceed ${MAX_TITLE_LENGTH} characters.`]
    },
    startedDate: {
      type: Date,
      default: null,
      set: (value: Date | string | undefined) => {
        if (!value) return null;
        const date = new Date(value);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()); // remove the time part
      },
    },
    completedDate: {
      type: Date,
      default: null,
      set: (value: Date | string | undefined) => {
        if (!value) return null;
        const date = new Date(value);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()); // remove the time part
      },
    },
    isMine: {
      type: Boolean,
      default: false,
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

researchSchema.set('toJSON', { virtuals: true });
researchSchema.set('toObject', { virtuals: true });

researchSchema.pre('validate', async function (next) {
  // validate status
  if (!Object.values(DocumentStatus).includes(this.status)) {
    next(
      new AppError(`Invalid status: '${this.status}'. Allowed values are: ${Object.values(DocumentStatus).join(', ')}.`, 400)
    );
  }

  next();
});

researchSchema.index({ type: 1, completedYear: -1 });
researchSchema.index({ title: 'text', location: 'text' });

const ResearchModel = model<ResearchDocument>('Research', researchSchema);

export default ResearchModel;
