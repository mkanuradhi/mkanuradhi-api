import { Document, Types } from "mongoose";

interface BaseDocument extends Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export default BaseDocument;