import { Schema } from "mongoose";

const AppUserSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    name:   { type: String, trim: true },
    email:  { type: String, trim: true },
    picture:{ type: String, trim: true },
  },
  { _id: false }
);

export default AppUserSchema;