import { model, Schema } from "mongoose";
import ContactMessageDocument from "../documents/contact-message-document";
import DocumentStatus from "../enums/document-status";
import AppError from "../errors/app-error";

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 80;

const MIN_EMAIL_LENGTH = 4;
const MAX_EMAIL_LENGTH = 100;

const MIN_MESSAGE_LENGTH = 6;
const MAX_MESSAGE_LENGTH = 500;

const MAX_USER_AGENT_LENGTH = 600;

const contactMessageSchema = new Schema<ContactMessageDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      minLength: [MIN_NAME_LENGTH, `Name must be minimum ${MIN_NAME_LENGTH} characters long.`],
      maxLength: [MAX_NAME_LENGTH, `Name cannot exceed ${MAX_NAME_LENGTH} characters.`]
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      trim: true,
      minLength: [MIN_EMAIL_LENGTH, `Email must be minimum ${MIN_EMAIL_LENGTH} characters long.`],
      maxLength: [MAX_EMAIL_LENGTH, `Email cannot exceed ${MAX_EMAIL_LENGTH} characters.`]
    },
    message: {
      type: String,
      required: [true, 'Message is required.'],
      trim: true,
      minLength: [MIN_MESSAGE_LENGTH, `Message must be minimum ${MIN_MESSAGE_LENGTH} characters long.`],
      maxLength: [MAX_MESSAGE_LENGTH, `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`]
    },
    userAgent: {
      type: String,
      nullable: true,
      trim: true,
      maxLength: [MAX_USER_AGENT_LENGTH, `User agent cannot exceed ${MAX_USER_AGENT_LENGTH} characters.`],
    },
    screen: {
      type: String,
      nullable: true,
      trim: true,
      maxLength: [MAX_NAME_LENGTH, `Screen size cannot exceed ${MAX_NAME_LENGTH} characters.`],
    },
    timezone: {
      type: String,
      nullable: true,
      trim: true,
      maxLength: [MAX_EMAIL_LENGTH, `Timezone cannot exceed ${MAX_EMAIL_LENGTH} characters.`],
    },
    language: {
      type: String,
      nullable: true,
      trim: true,
      maxLength: [MAX_NAME_LENGTH, `Language cannot exceed ${MAX_NAME_LENGTH} characters.`],
    },
    ipAddress: {
      type: String,
      nullable: true,
      trim: true,
      maxLength: [MAX_EMAIL_LENGTH, `IP address cannot exceed ${MAX_EMAIL_LENGTH} characters.`],
    },
    city: {
      type: String,
      nullable: true,
      trim: true,
      maxLength: [MAX_NAME_LENGTH, `City cannot exceed ${MAX_NAME_LENGTH} characters.`],
    },
    country: {
      type: String,
      nullable: true,
      trim: true,
      maxLength: [MAX_NAME_LENGTH, `Country cannot exceed ${MAX_NAME_LENGTH} characters.`],
    },
    latitude: {
      type: Number,
      nullable: true,
    },
    longitude: {
      type: Number,
      nullable: true,
    },
    browser: {
      type: String,
      nullable: true,
      trim: true,
      maxLength: [MAX_NAME_LENGTH, `Browser cannot exceed ${MAX_NAME_LENGTH} characters.`],
    },
    os: {
      type: String,
      nullable: true,
      trim: true,
      maxLength: [MAX_NAME_LENGTH, `Operating system cannot exceed ${MAX_NAME_LENGTH} characters.`],
    },
    deviceType: {
      type: String,
      nullable: true,
      trim: true,
      maxLength: [MAX_NAME_LENGTH, `Device type cannot exceed ${MAX_NAME_LENGTH} characters.`],
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

contactMessageSchema.set('toJSON', { virtuals: true });
contactMessageSchema.set('toObject', { virtuals: true });

contactMessageSchema.pre('validate', async function (next) {
  // validate status
  if (!Object.values(DocumentStatus).includes(this.status)) {
    next(
      new AppError(`Invalid status: '${this.status}'. Allowed values are: ${Object.values(DocumentStatus).join(', ')}.`, 400)
    );
  }

  next();
});

const ContactMessageModel = model<ContactMessageDocument>('ContactMessage', contactMessageSchema);

export default ContactMessageModel;
