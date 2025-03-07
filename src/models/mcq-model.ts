import { model, Schema, Types } from "mongoose";
import McqDocument from "../documents/mcq-document";

const choiceSchema = new Schema(
  {
    textEn: { type: String, required: true },
    textSi: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false }
);

const mcqSchema = new Schema<McqDocument>(
  {
    questionEn: {
      type: String,
      required: [true, "Question in English is required."],
      trim: true,
    },
    questionSi: {
      type: String,
      required: [true, "Question in Sinhala is required."],
      trim: true,
    },
    choices: {
      type: [choiceSchema],
      required: [true, "Choices are required."],
      minlength: 1,
      validate: {
        validator: function (val: any[]) {
          return Array.isArray(val) && val.length > 0;
        },
        message: "At least one choice is required"
      }
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
  },
  { timestamps: true }
);

mcqSchema.index({ quizId: 1 });

const McqModel = model<McqDocument>('Mcq', mcqSchema);

export default McqModel;
