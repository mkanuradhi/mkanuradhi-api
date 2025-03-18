import { model, Schema, Types } from "mongoose";
import QuizDocument from "../documents/quiz-document";
import DocumentStatus from "../enums/document-status";

const quizSchema = new Schema<QuizDocument>(
  {
    titleEn: {
      type: String,
      required: [true, "Title in English is required."],
      trim: true,
    },
    titleSi: {
      type: String,
      required: [true, "Title in Sinhala is required."],
      trim: true,
    },
    duration: {
      type: Number,
      min: 1
    },
    availableFrom: {
      type: Date,
      trim: true,
    },
    availableUntil: {
      type: Date,
      trim: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course ID is required."],
      validate: {
        validator: function (val: string) {
          return Types.ObjectId.isValid(val);
        },
        message: "Invalid Course ID format. Please provide a valid MongoDB ObjectId."
      }
    },
    status: {
      type: String,
      enum: {
        values: Object.values(DocumentStatus),
        message: 'Quiz status `{VALUE}` is not valid.',
      },
      default: DocumentStatus.INACTIVE,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

quizSchema.index({ courseId: 1 });

const QuizModel = model<QuizDocument>('Quiz', quizSchema);

export default QuizModel;
