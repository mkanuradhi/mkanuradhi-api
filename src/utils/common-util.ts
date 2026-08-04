import FormData from "form-data";
import axios, { AxiosResponse } from "axios";
import { ImgbbResponseDto } from "../dtos/imgbb-response-dto";
import AppError from "../errors/app-error";
import { Request } from "express";
import { AVAILABLE_LANGS, DEFAULT_LANG } from "../constants/common-vars";
import { SearchParamsDto } from "../dtos/search-params-dto";
import DocumentStatus from "../enums/document-status";
import { DEFAULT_LOCALE, Locale, LocalizedString, SUPPORTED_LOCALES } from "../types/locale.types";

export const uploadImageToCloudService = async (file: Express.Multer.File): Promise<string> => {
  const formData = new FormData();

  formData.append("image", file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
  });

  const baseUrl = process.env.IMGBB_BASE_URL || '';
  const apiKey = process.env.IMGBB_API_KEY;

  try {
    const response: AxiosResponse<ImgbbResponseDto> = await axios.post(
      baseUrl,
      formData, {
        headers: formData.getHeaders(),
        params: {
          key: apiKey,
        },
      }
    );

    if (response.data && response.data.data && response.data.data.url) {
      return response.data.data.url;
    }

    throw new AppError("Image upload failed. Invalid response from server.", 500);
  } catch (error) {
    if (error instanceof AppError) throw error;

    // extract imgbb error message if available
    if (axios.isAxiosError(error) && error.response?.data?.error?.message) {
      throw new AppError(`Image upload failed: ${error.response.data.error.message}`, 500);
    }

    throw new AppError('Image upload failed. Please try again.', 500);
  }
};

export const parseLangQueryParam = (req: Request): string => {
  const langParam = req.query.lang as string;
  return AVAILABLE_LANGS.includes(langParam) ? langParam : DEFAULT_LANG;
}

export const capitalizeLang = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1);

export const sanitizeString = (str: string) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-');
}

export const parseSearchParams = (req: Request): SearchParamsDto => {
  const parseStatus = (value: string | undefined): DocumentStatus | undefined => {
    if (!value) return undefined;
    const normalizedValue = value.trim().toUpperCase();
    if (Object.values(DocumentStatus).includes(normalizedValue as DocumentStatus)) {
      return normalizedValue as DocumentStatus;
    }
    return undefined;
  };

  return {
    query: (req.query.q as string) || "",
    page: parseInt(req.query.page as string) || 0,
    size: Math.min(parseInt(req.query.size as string) || 10, 100),
    status: parseStatus(req.query.status as string),
    sort: req.query.sort as string, // Expected: "latest", "oldest"
  };
};

export const buildSearchFilter = ({ query, status }: SearchParamsDto): Record<string, any> => {
  const filter: Record<string, any> = {
    status: { $ne: DocumentStatus.INACTIVE },
    deleted: false,
  };

  if (query) filter.$text = { $search: query };
  if (status !== undefined) filter.status = status;

  return filter;
};

/**
 * Converts a string to a URL-safe path.
 */
const generatePath = (text: string): string => {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric except spaces and hyphens
    .replace(/\s+/g, '-')         // replace spaces with hyphens
    .replace(/-+/g, '-')          // collapse multiple hyphens
    .replace(/^-|-$/g, '');       // trim leading/trailing hyphens
};

/**
 * Ensures path is unique in the collection.
 */
export const generateUniquePath = async (
  baseText: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> => {
  const base = generatePath(baseText);
  let slug    = base;
  let counter = 2;

  while (await exists(slug)) {
    slug = `${base}-${counter}`;
    counter++;
  }

  return slug;
};

export const localizeField = (field: LocalizedString | undefined, locale: Locale): string => {
  if (!field) return "";
  return field[locale] ?? field[DEFAULT_LOCALE] ?? Object.values(field).find(v => !!v) ?? '';
};

export const resolveLocale = (lang: string): Locale => {
  return SUPPORTED_LOCALES.includes(lang as Locale)
    ? (lang as Locale)
    : DEFAULT_LOCALE;
};
