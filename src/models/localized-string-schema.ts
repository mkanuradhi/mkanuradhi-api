import { Schema } from 'mongoose';
import { LocalizedString } from '../types/locale.types';

export const localizedStringSchema = new Schema<LocalizedString>(
  {
    en: {
      type: String,
      trim: true,
    },
    si: {
      type: String,
      trim: true,
    },
  }, {
    _id: false, // no separate _id — it's embedded, not a collection
    strict: false, // strict: false = future locales need no migration
  }
);