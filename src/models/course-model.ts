import { model, Schema } from "mongoose";
import CourseDocument from "../documents/course-document";

const courseSchema = new Schema<CourseDocument>(
  {
    year: {
      type: Number,
      required: [true, "Year is required."],
      min: [1900, "Year must be a valid four-digit number."], // Prevents invalid years
    },
    code: {
      type: String,
      trim: true,
    },
    credits: {
      type: Number,
      min: [1, "Credits must be at least 1."],
    },
    titleEn: {
      type: String,
      required: [true, "Course title in English is required."],
      trim: true,
    },
    outlineEn: {
      type: String,
      trim: true,
    },
    locationEn: {
      type: String,
      required: [true, "Location in English is required."],
      trim: true,
    },
    titleSi: {
      type: String,
      required: [true, "Course title in Sinhala is required."],
      trim: true,
    },
    outlineSi: {
      type: String,
      trim: true,
    },
    locationSi: {
      type: String,
      required: [true, "Location in Sinhala is required."],
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: '__v'
  }
);

courseSchema.index({ code: 1 }, { sparse: true });
courseSchema.index({ titleEn: 1 });
courseSchema.index({ titleSi: 1 }, { sparse: true });

const CourseModel = model<CourseDocument>("Course", courseSchema);

export default CourseModel;
