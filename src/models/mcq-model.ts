import { model, Schema, Types } from "mongoose";
import McqDocument from "../documents/mcq-document";
import DocumentStatus from "../enums/document-status";

const MIN_QUESTION_LENGTH = 3;
const MAX_QUESTION_LENGTH = 2000;

const MAX_EXPLANATION_LENGTH = 3000;

const mcqChoiceSchema = new Schema(
  {
    text: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false }
);

const mcqSchema = new Schema<McqDocument>(
  {
    question: {
      type: String,
      required: [true, "Question is required."],
      trim: true,
      minLength: [MIN_QUESTION_LENGTH, `Question must be minimum ${MIN_QUESTION_LENGTH} characters long.`],
      maxLength: [MAX_QUESTION_LENGTH, `Question cannot exceed ${MAX_QUESTION_LENGTH} characters.`],
    },
    choices: {
      type: [mcqChoiceSchema],
      required: [true, "Choices are required."],
      minlength: 2,
      validate: {
        validator: function (val: any[]) {
          return Array.isArray(val) && val.length > 1;
        },
        message: "At least two choices are required"
      }
    },
    solutionExplanation: {
      type: String,
      trim: true,
      maxLength: [MAX_EXPLANATION_LENGTH, `Solution explanation cannot exceed ${MAX_EXPLANATION_LENGTH} characters.`],
    },
    quizId: {
      type: Schema.Types.ObjectId,
      ref: "Quiz",
      required: [true, "Quiz ID is required."],
      validate: {
        validator: function (val: string) {
          return Types.ObjectId.isValid(val);
        },
        message: "Invalid Quiz ID format. Please provide a valid MongoDB ObjectId."
      }
    },
    status: {
      type: String,
      enum: {
        values: Object.values(DocumentStatus),
        message: 'Quiz status `{VALUE}` is not valid.',
      },
      default: DocumentStatus.ACTIVE,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

mcqSchema.index({ quizId: 1 });

const McqModel = model<McqDocument>('Mcq', mcqSchema);

export default McqModel;
