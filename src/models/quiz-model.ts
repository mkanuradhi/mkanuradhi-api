import { model, Schema, Types } from "mongoose";
import QuizDocument from "../documents/quiz-document";

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
      required: [true, "Duration is required."],
      min: 1
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
  },
  { timestamps: true }
);

quizSchema.index({ courseId: 1 });

const QuizModel = model<QuizDocument>('Quiz', quizSchema);

export default QuizModel;
