import { z } from "zod";
import AppError from "../errors/app-error";
import { Types } from "mongoose";

export const validatePaginationDetails = (page: number, size: number): boolean => {
  validatePage(page);
  validateSize(size);
  return true;
}

const validatePage = (page: number): boolean => {
  if (page < 0) {
      throw new AppError(`The page: ${page} parameter must be 0 or a positive integer`, 400);
  }
  return true;
}

const validateSize = (size: number): boolean => {
  if (size < 1) {
      throw new AppError(`The size: ${size} parameter must be a positive integer`, 400);
  }
  return true;
}

export const validateDocId = (id: string): boolean => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(`${id} is not in valid ID format`, 400);
  }
  return true;
}

export const validateQuizAvailableDates = (availableFrom?: Date | string, availableUntil?: Date | string): void => {
  if (availableFrom) {
    const from = new Date(availableFrom);
    if (isNaN(from.getTime())) {
      throw new AppError("availableFrom is not a valid date", 400);
    }
  }
  if (availableUntil) {
    const until = new Date(availableUntil);
    if (isNaN(until.getTime())) {
      throw new AppError("availableUntil is not a valid date", 400);
    }
  }
  if (availableFrom && availableUntil) {
    const from = new Date(availableFrom);
    const until = new Date(availableUntil);
    if (from >= until) {
      throw new AppError("availableFrom must be earlier than availableUntil", 400);
    }
  }
}

// reusable — optional fields, at least one locale required
export const localizedStringSchema = z.object({
  en: z.string().trim().optional(),
  si: z.string().trim().optional(),
}).refine(
  data => !!data.en || !!data.si,
  { message: 'At least one locale (en or si) is required.' }
);

// optional localized string — neither locale required
export const optionalLocalizedStringSchema = z.object({
  en: z.string().trim().optional(),
  si: z.string().trim().optional(),
}).optional();
