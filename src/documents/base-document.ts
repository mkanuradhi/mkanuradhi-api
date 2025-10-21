import { Document, Types } from "mongoose";
import AppUser from "../interfaces/i-app-user";

interface BaseDocument extends Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: AppUser;
  updatedBy?: AppUser;
  __v: number;
}

export default BaseDocument;