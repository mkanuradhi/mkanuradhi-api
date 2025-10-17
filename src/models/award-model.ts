import { model, Schema } from "mongoose";
import AwardDocument from "../documents/award-document";
import AwardType from "../enums/award-type";
import AwardScope from "../enums/award-scope";
import AwardRole from "../enums/award-role";
import AwardResult from "../enums/award-result";
import AwardCategory from "../enums/award-category";
import DocumentStatus from "../enums/document-status";

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 700;

const MAX_CO_RECIPIENTS = 20;
const MAX_CO_RECIPIENT_NAME_LENGTH = 150;

const MAX_URL_LENGTH = 400;

const awardSchema = new Schema<AwardDocument>(
  {
    titleEn: {
      type: String,
      required: [true, "Award title in English is required."],
      trim: true,
      maxLength: [MAX_TITLE_LENGTH, `Title in English cannot exceed ${MAX_TITLE_LENGTH} characters.`],
    },
    descriptionEn: {
      type: String,
      required: [true, "Award description in English is required."],
      trim: true,
      maxLength: [MAX_DESCRIPTION_LENGTH, `Description in English cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`],
    },
    issuerEn: {
      type: String,
      required: [true, "Issuer in English is required."],
      trim: true,
      maxLength: [MAX_DESCRIPTION_LENGTH, `Issuer in English cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`],
    },
    issuerLocationEn: {
      type: String,
      trim: true,
      maxLength: [MAX_DESCRIPTION_LENGTH, `Issuer location in English cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`],
    },
    ceremonyLocationEn: {
      type: String,
      trim: true,
      maxLength: [MAX_DESCRIPTION_LENGTH, `Ceremony location in English cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`],
    },
    coRecipientsEn: {
      type: [String],
      default: [],
      validate: [
        {
          validator: function (v: string[]) {
            return v.length <= MAX_CO_RECIPIENTS; // limit total names
          },
          message: `Co-recipients cannot exceed ${MAX_CO_RECIPIENTS} names.`
        },
        {
          validator: function (v: string[]) {
            return v.every(name => name.length <= MAX_CO_RECIPIENT_NAME_LENGTH); // check each string
          },
          message: `Each co-recipient name must be at most ${MAX_CO_RECIPIENT_NAME_LENGTH} characters long.`
        }
      ]
    },
    titleSi: {
      type: String,
      trim: true,
      maxLength: [MAX_TITLE_LENGTH, `Title in Sinhala cannot exceed ${MAX_TITLE_LENGTH} characters.`],
    },
    descriptionSi: {
      type: String,
      trim: true,
      maxLength: [MAX_DESCRIPTION_LENGTH, `Description in Sinhala cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`],
    },
    issuerSi: {
      type: String,
      trim: true,
      maxLength: [MAX_DESCRIPTION_LENGTH, `Issuer in Sinhala cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`],
    },
    issuerLocationSi: {
      type: String,
      trim: true,
      maxLength: [MAX_DESCRIPTION_LENGTH, `Issuer location in Sinhala cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`],
    },
    ceremonyLocationSi: {
      type: String,
      trim: true,
      maxLength: [MAX_DESCRIPTION_LENGTH, `Ceremony location in Sinhala cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`],
    },
    coRecipientsSi: {
      type: [String],
      default: [],
      validate: [
        {
          validator: function (v: string[]) {
            return v.length <= MAX_CO_RECIPIENTS; // limit total names
          },
          message: `Co-recipients cannot exceed ${MAX_CO_RECIPIENTS} names.`
        },
        {
          validator: function (v: string[]) {
            return v.every(name => name.length <= MAX_CO_RECIPIENT_NAME_LENGTH); // check each string
          },
          message: `Each co-recipient name must be at most ${MAX_CO_RECIPIENT_NAME_LENGTH} characters long.`
        }
      ]
    },
    receivedDate: {
      type: Date,
      required: [true, "Recieved date is required."],
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: Object.values(AwardType),
        message: 'Award type `{VALUE}` is not valid.',
      },
      default: AwardType.AWARD,
    },
    scope: {
      type: String,
      enum: {
        values: Object.values(AwardScope),
        message: 'Award scope `{VALUE}` is not valid.',
      },
      default: AwardScope.NATIONAL,
    },
    role: {
      type: String,
      enum: {
        values: Object.values(AwardRole),
        message: 'Award role `{VALUE}` is not valid.',
      },
      default: AwardRole.INDIVIDUAL,
    },
    result: {
      type: String,
      enum: {
        values: Object.values(AwardResult),
        message: 'Award result `{VALUE}` is not valid.',
      },
      default: AwardResult.WON,
    },
    category: {
      type: String,
      enum: {
        values: Object.values(AwardCategory),
        message: 'Award category `{VALUE}` is not valid.',
      },
      default: AwardCategory.RESEARCH,
    },
    eventUrl: {
      type: String,
      trim: true,
      maxLength: [MAX_URL_LENGTH, `Event URL cannot exceed ${MAX_URL_LENGTH} characters.`]
    },
    relatedWorkUrl: {
      type: String,
      trim: true,
      maxLength: [MAX_URL_LENGTH, `Related work URL cannot exceed ${MAX_URL_LENGTH} characters.`]
    },
    monetaryValue: {
      type: String,
      trim: true,
      maxLength: [MAX_TITLE_LENGTH, `Monetary value cannot exceed ${MAX_TITLE_LENGTH} characters.`]
    },
    issuerImage: {
      type: String,
      trim: true,
    },
    primaryImage: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(DocumentStatus),
        message: 'Award status `{VALUE}` is not valid.',
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

// Default listing for the site (active, not deleted, newest first)
awardSchema.index(
  { deleted: 1, status: 1, receivedDate: -1 },
  { name: 'idx_public_listing' }
);

// Admin views: newest created first, quick status toggles
awardSchema.index(
  { status: 1, createdAt: -1 },
  { name: 'idx_admin_status_created' }
);

const AwardModel = model<AwardDocument>("Award", awardSchema);

export default AwardModel;
