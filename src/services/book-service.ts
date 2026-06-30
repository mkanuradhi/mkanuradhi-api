import AppUser from "../interfaces/i-app-user";
import AppError from "../errors/app-error";
import Book, { BookPreviewImage, LocalizedBook, LocalizedSummaryBook } from "../interfaces/i-book";
import BookModel from "../models/book-model";
import logger from "../config/logger-config";
import { mapDocumentsToBooks, mapDocumentToBook } from "../mappers/book-mapper";
import { validatePaginationDetails } from "../validators/common-validator";
import { generateUniquePath, localizeField, uploadImageToCloudService } from "../utils/common-util";
import BookDocument from "../documents/book-document";
import { DEFAULT_LOCALE, Locale, SUPPORTED_LOCALES } from "../types/locale.types";
import DocumentStatus from "../enums/document-status";
import { v4 as uuidv4 } from 'uuid';
import { ActivationBookDto, CreateBookDto, MAX_BOOK_PREVIEW_IMAGES, ReorderPreviewImagesDto, UpdateBookDto } from "../validators/book-validator";
import { deleteFileFromR2, uploadFileToR2 } from "../utils/r2-util";

export const createBook = async (bookDto: CreateBookDto, appUser?: AppUser | null): Promise<Book> => {
  const titleTextEn = bookDto.title.en?.trim();
  if (!titleTextEn) throw new AppError('Title must have en locale.', 400);

  // duplicate check — title is the stable unique identifier
  const existingBookDoc = await BookModel.findOne({
    'title.en': titleTextEn,
    deleted: false
  });
  if (existingBookDoc) {
      throw new AppError(`A book already exists with the title: ${titleTextEn}`, 400);
  }

  // generate unique path — checks DB for conflicts automatically
  const uniquePath = await generateUniquePath(
    titleTextEn,
    async (slug) => !!(await BookModel.exists({ path: slug }))
  );

  const bookDoc = await BookModel.create({
    ...bookDto,
    path:          uniquePath,
    createdBy:     appUser ?? undefined,
    updatedBy:     appUser ?? undefined,
  });

  logger.info(`Book created for ${titleTextEn}`);
  return mapDocumentToBook(bookDoc);
}

export const getBooks = async (page: number, size: number): Promise<{ items: Book[], totalCount: number }> => {
  validatePaginationDetails(page, size);
  const [totalCount, bookDocs] = await Promise.all([
    BookModel.countDocuments({ deleted: false }),
    BookModel
      .find(
        { deleted: false  }, 
        {
          title: 1,
          subtitle: 1,
          description: 1,
          authors: 1,
          writtenLang: 1,
          path: 1,
          publishedYear: 1,
          tags: 1,
          coverImage: 1,
          featured: 1,
          displayOrder: 1,
          status: 1,
        })
      .sort({ displayOrder: 1, createdAt: -1  })
      .skip(page * size)
      .limit(size)
  ]);
  return {
    items: mapDocumentsToBooks(bookDocs),
    totalCount
  };
}

export const updateBook = async (bookId: string, bookDto: UpdateBookDto, appUser?: AppUser | null): Promise<Book> => {
  // Verify book exists first
  const existingBookDoc = await BookModel.findOne({ _id: bookId, deleted: false });
  if (!existingBookDoc) throw new AppError(`Book not found for id: ${bookId}`, 404);

  const titleTextEn = bookDto.title?.en?.trim();
  if (!titleTextEn) throw new AppError('Title must have en locale.', 400);

  // Duplicate title check — exclude current doc
  const existingDuplicateDoc = await BookModel.findOne({
    'title.en': titleTextEn,
    _id:        { $ne: bookId }, // exclude the current doc
    deleted:    false,
  });
  if (existingDuplicateDoc) {
    throw new AppError(`A book already exists with the title: "${titleTextEn}"`, 400);
  }

  let mergedPreviewImages = existingBookDoc.previewImages ?? [];

  if (bookDto.previewImages) {
    const existingImages = existingBookDoc.previewImages ?? [];

    const existingImageMap = new Map(
      existingImages.map(img => [img.id, img])
    );

    const submittedIds = bookDto.previewImages.map(img => img.id);
    const missingId     = submittedIds.find(id => !existingImageMap.has(id));
    if (missingId) {
      throw new AppError(`Preview image not found: ${missingId}`, 400);
    }

    if (submittedIds.length !== existingImages.length) {
      throw new AppError('Preview images update must include all existing images.', 400);
    }

    mergedPreviewImages = bookDto.previewImages.map(dtoImg => {
      const existingImg = existingImageMap.get(dtoImg.id)!;
      return {
        id:           existingImg.id,
        url:          existingImg.url,
        caption:      dtoImg.caption,
        displayOrder: dtoImg.displayOrder,
      };
    });
  }

  const bookDoc = await BookModel.findOneAndUpdate(
    { _id: bookId, __v: bookDto.v, deleted: false },  // atomic version check
    {
      $set: {
        title:         bookDto.title,
        subtitle:      bookDto.subtitle,
        description:   bookDto.description,
        content:       bookDto.content,
        subject:       bookDto.subject,
        authors:       bookDto.authors,
        writtenLang:   bookDto.writtenLang,
        publisher:     bookDto.publisher,
        publishedYear: bookDto.publishedYear,
        edition:       bookDto.edition,
        isbns:         bookDto.isbns,
        pages:         bookDto.pages,
        tags:          bookDto.tags,
        buyLink:       bookDto.buyLink,
        featured:      bookDto.featured,
        displayOrder:  bookDto.displayOrder,
        previewImages: mergedPreviewImages,
        updatedBy:     appUser ?? undefined,
      },
      $inc: { __v: 1 },
    },
    { new: true, runValidators: true }
  );

  if (!bookDoc) {
    throw new AppError('Book was modified by another request. Please refresh and try again.', 409);
  }

  logger.info(`Book updated: ${bookId}`);
  return mapDocumentToBook(bookDoc);
}

export const getBook = async (bookId: string): Promise<Book> => {
  const bookDoc = await BookModel.findOne({
    _id:     bookId,
    deleted: false,
  });

  if (!bookDoc) throw new AppError(`Book not found for id: ${bookId}`, 404);

  return mapDocumentToBook(bookDoc);
};

export const deleteBook = async (bookId: string, appUser?: AppUser | null): Promise<void> => {
  const bookDoc = await BookModel.findOne({ 
    _id: bookId,
    deleted: false,
  });
  if (!bookDoc) {
    throw new AppError(`Cannot find the book with ID '${bookId}' or it is already deleted.`, 404);
  }

  const deletedSuffix = `DELETED-${uuidv4()}`;

  const updatedBookDoc = await BookModel.findByIdAndUpdate(
    bookId,
    {
      $set: {
        'title.en': bookDoc.title.en ? `${bookDoc.title.en}-${deletedSuffix}` : undefined,
        'title.si': bookDoc.title.si ? `${bookDoc.title.si}-${deletedSuffix}` : undefined,
        'path':     `${bookDoc.path}-${deletedSuffix}`,
        deleted:    true,
        updatedBy:  appUser ?? undefined,
      },
      $inc: { __v: 1 },
    },
    { new: true }
  );

  if (!updatedBookDoc) {
    throw new AppError('Failed to delete book.', 500);
  }
  logger.info(`Book deleted: ${bookId}`);
}

export const toggleBookActivation = async (bookId: string, bookDto: ActivationBookDto, appUser?: AppUser | null): Promise<Book> => {
  const bookDoc = await BookModel.findOne({ _id: bookId, deleted: false });

  if (!bookDoc) {
    throw new AppError(`Cannot find the book with ID: ${bookId}.`, 404);
  }

  // cover image is required before a book can be made active
  if (bookDto.status === DocumentStatus.ACTIVE && !bookDoc.coverImage) {
    throw new AppError('Cannot activate a book without a cover image.', 400);
  }

  bookDoc.status    = bookDto.status;
  bookDoc.updatedBy = appUser ?? undefined;
  bookDoc.increment(); // Increment the version for optimistic concurrency control

  await bookDoc.save({ validateModifiedOnly: true });

  logger.info(`Book status updated for ID: ${bookId}`);
  return mapDocumentToBook(bookDoc);
}

export const getLocalizedBooks = async (lang: string, page: number, size: number): Promise<{ items: LocalizedSummaryBook[], totalCount: number }> => {
  validatePaginationDetails(page, size);

  const locale = resolveLocale(lang);

  const [totalCount, bookDocs] = await Promise.all([
    BookModel.countDocuments({ deleted: false, status: DocumentStatus.ACTIVE }),
    BookModel
      .find(
        { deleted: false, status: DocumentStatus.ACTIVE },
        {
          title:         1,
          subtitle:      1,
          description:   1,
          authors:       1,
          writtenLang:   1,
          path:          1,
          publishedYear: 1,
          tags:          1,
          coverImage:    1,
          featured:      1,
          displayOrder:  1,
        }
      )
      .sort({ displayOrder: 1, createdAt: -1 })
      .skip(page * size)
      .limit(size)
  ]);

  return {
    items: bookDocs.map(doc => toLocalizedSummaryBook(doc, locale)),
    totalCount,
  };
};

export const getLocalizedBookByPath = async (lang: string, bookPath: string): Promise<LocalizedBook> => {
  const locale = resolveLocale(lang);

  const bookDoc = await BookModel.findOne({
    path:    bookPath.trim(),
    deleted: false,
    status:  DocumentStatus.ACTIVE,   // public only sees active books
  });

  if (!bookDoc) throw new AppError(`Book not found for path: ${bookPath}`, 404);

  logger.info(`Book fetched by path: ${bookPath}`);
  return toLocalizedBook(bookDoc, locale);
}

export const uploadCoverImage = async (bookId: string, imageFile?: Express.Multer.File): Promise<Book> => {
  const bookDoc = await BookModel.findOne({ _id: bookId, deleted: false });
  if (!bookDoc) {
    throw new AppError(`Cannot find the book with ID: '${bookId}'.`, 404);
  }

  if (!imageFile) {
    throw new AppError('No cover image file provided.', 400);
  }

  const imageUrl = await uploadImageToCloudService(imageFile);
  if (!imageUrl) {
    throw new AppError('Failed to upload cover image. Please try again.', 500);
  }

  bookDoc.coverImage = imageUrl;
  bookDoc.increment();
  await bookDoc.save({ validateModifiedOnly: true });

  logger.info(`Uploaded cover image for book ID: ${bookId}`);
  return mapDocumentToBook(bookDoc);
};

export const deleteCoverImage = async (bookId: string): Promise<Book> => {
  const bookDoc = await BookModel.findOne({ _id: bookId, deleted: false });
  if (!bookDoc) {
    throw new AppError(`Cannot find the book with ID: '${bookId}'.`, 404);
  }

  if (!bookDoc.coverImage) {
    throw new AppError('This book has no cover image to delete.', 400);
  }

  bookDoc.coverImage = undefined;
  bookDoc.status = DocumentStatus.INACTIVE; // Deactivate the book if cover image is deleted
  bookDoc.increment();
  await bookDoc.save({ validateModifiedOnly: true });

  logger.info(`Deleted cover image for book ID: ${bookId}`);
  return mapDocumentToBook(bookDoc);
};

export const uploadPreviewImages = async (bookId: string, imageFiles?: Express.Multer.File[]): Promise<Book> => {
  const bookDoc = await BookModel.findOne({ _id: bookId, deleted: false });
  if (!bookDoc) throw new AppError(`Cannot find the book with ID: '${bookId}'.`, 404);

  if (!imageFiles || imageFiles.length === 0) {
    throw new AppError('No preview image files provided.', 400);
  }

  const currentCount = bookDoc.previewImages?.length ?? 0;
  if (currentCount + imageFiles.length > MAX_BOOK_PREVIEW_IMAGES) {
    throw new AppError(`Cannot exceed ${MAX_BOOK_PREVIEW_IMAGES} preview images. Currently has ${currentCount}.`, 400);
  }

  // upload all files concurrently
  const uploadedUrls = await Promise.all(
    imageFiles.map(file => uploadImageToCloudService(file))
  );

  // map each uploaded URL to a BookPreviewImage sub-document
  const newImages: BookPreviewImage[] = uploadedUrls.map((url, index) => ({
    id: uuidv4(),
    url,
    displayOrder: currentCount + index,  // append after existing images
  }));

  bookDoc.previewImages = [...(bookDoc.previewImages ?? []), ...newImages];
  bookDoc.increment();
  await bookDoc.save({ validateModifiedOnly: true });

  logger.info(`Uploaded ${uploadedUrls.length} preview image(s) for book ID: ${bookId}`);
  return mapDocumentToBook(bookDoc);
};

export const deletePreviewImage = async (bookId: string, previewImageId: string): Promise<Book> => {
  const bookDoc = await BookModel.findOne({ _id: bookId, deleted: false });
  if (!bookDoc) throw new AppError(`Cannot find the book with ID: '${bookId}'.`, 404);

  const existingImages = bookDoc.previewImages ?? [];

  const imageExists = existingImages.some(img => img.id === previewImageId);
  if (!imageExists) {
    throw new AppError('Preview image not found for this book.', 404);
  }

  bookDoc.previewImages = existingImages.filter(img => img.id !== previewImageId);
  bookDoc.increment();
  await bookDoc.save({ validateModifiedOnly: true });

  logger.info(`Deleted preview image for book ID: ${bookId}`);
  return mapDocumentToBook(bookDoc);
};

export const reorderPreviewImages = async (bookId: string, dto: ReorderPreviewImagesDto): Promise<Book> => {
  const bookDoc = await BookModel.findOne({ _id: bookId, deleted: false });
  if (!bookDoc) throw new AppError(`Cannot find the book with ID: '${bookId}'.`, 404);

  const existingImages = bookDoc.previewImages ?? [];

  // ensure submitted IDs exactly match existing ones — no additions or removals
  const existingIdSet  = new Set(existingImages.map(img => img.id));
  const submittedIdSet = new Set(dto.ids);

  const sameLength = existingIdSet.size === submittedIdSet.size;
  const sameIds    = [...submittedIdSet].every(id => existingIdSet.has(id));

  if (!sameLength || !sameIds) {
    throw new AppError('Reorder list must contain exactly the same IDs as existing preview images.', 400);
  }

  // rebuild array in submitted order with updated displayOrder
  bookDoc.previewImages = dto.ids.map((id, index) => {
    const img = existingImages.find(img => img.id === id)!;
    return { ...img, displayOrder: index };
  });

  bookDoc.increment();
  await bookDoc.save({ validateModifiedOnly: true });

  logger.info(`Reordered preview images for book ID: ${bookId}`);
  return mapDocumentToBook(bookDoc);
};

export const uploadPdfTeaser = async (bookId: string, pdfFile?: Express.Multer.File): Promise<Book> => {
  const bookDoc = await BookModel.findOne({ _id: bookId, deleted: false });
  if (!bookDoc) {
    throw new AppError(`Cannot find the book with ID: '${bookId}'.`, 404);
  }

  if (!pdfFile) {
    throw new AppError('No PDF file provided.', 400);
  }

  // delete old PDF from R2 before uploading new one
  if (bookDoc.pdfTeaser) {
    await deleteFileFromR2(bookDoc.pdfTeaser);
  }

  const pdfUrl = await uploadFileToR2(pdfFile, 'books/pdf-teasers');

  bookDoc.pdfTeaser = pdfUrl;
  bookDoc.increment();
  await bookDoc.save({ validateModifiedOnly: true });

  logger.info(`Uploaded PDF teaser for book ID: ${bookId}`);
  return mapDocumentToBook(bookDoc);
};

export const deletePdfTeaser = async (bookId: string): Promise<Book> => {
  const bookDoc = await BookModel.findOne({ _id: bookId, deleted: false });
  if (!bookDoc) {
    throw new AppError(`Cannot find the book with ID: '${bookId}'.`, 404);
  }

  if (!bookDoc.pdfTeaser) {
    throw new AppError('This book has no PDF teaser to delete.', 400);
  }

  await deleteFileFromR2(bookDoc.pdfTeaser);

  bookDoc.pdfTeaser = undefined;
  bookDoc.increment();
  await bookDoc.save({ validateModifiedOnly: true });

  logger.info(`Deleted PDF teaser for book ID: ${bookId}`);
  return mapDocumentToBook(bookDoc);
};

const toLocalizedBook = (doc: BookDocument, locale: Locale): LocalizedBook => {
  return {
    id:            doc._id.toString(),
    title:         localizeField(doc.title, locale),
    subtitle:      doc.subtitle ? localizeField(doc.subtitle, locale) : undefined,
    description:   localizeField(doc.description, locale),
    content:       localizeField(doc.content, locale),
    subject:       doc.subject.map((s) => localizeField(s, locale)),
    authors:       doc.authors.map(a => ({
      name:        localizeField(a.name, locale),
      role:        a.role,
      profileUrl:  a.profileUrl,
    })),
    path:          doc.path,
    writtenLang:   doc.writtenLang,
    publisher:     localizeField(doc.publisher, locale),
    publishedYear: doc.publishedYear,
    edition:       doc.edition,
    isbns:         doc.isbns ?? [],
    pages:         doc.pages,
    tags:          doc.tags,
    coverImage:    doc.coverImage,
    previewImages: doc.previewImages?.map(pi => ({
      id:      pi.id,
      url:     pi.url,
      caption: localizeField(pi.caption, locale),
      displayOrder: pi.displayOrder,
    })),
    buyLink:       doc.buyLink,
    pdfTeaser:     doc.pdfTeaser,
    featured:      doc.featured,
  };
};

const toLocalizedSummaryBook = (doc: BookDocument, locale: Locale): LocalizedSummaryBook => {
  return {
    id:            doc._id.toString(),
    title:         localizeField(doc.title, locale),
    subtitle:      doc.subtitle ? localizeField(doc.subtitle, locale) : undefined,
    description:   localizeField(doc.description, locale),
    authors:       doc.authors.map(a => ({
      name:        localizeField(a.name, locale),
      role:        a.role,
      profileUrl:  a.profileUrl,
    })),
    path:          doc.path,
    writtenLang:   doc.writtenLang,
    publishedYear: doc.publishedYear,
    tags:          doc.tags,
    coverImage:    doc.coverImage,
    featured:      doc.featured,
    displayOrder:  doc.displayOrder,
  };
};

const resolveLocale = (lang: string): Locale => {
  return SUPPORTED_LOCALES.includes(lang as Locale)
    ? (lang as Locale)
    : DEFAULT_LOCALE;
};
