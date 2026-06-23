import AppUser from "../interfaces/i-app-user";
import AppError from "../errors/app-error";
import Book, { LocalizedBook, LocalizedSummaryBook } from "../interfaces/i-book";
import BookModel from "../models/book-model";
import logger from "../config/logger-config";
import { mapDocumentsToBooks, mapDocumentToBook } from "../mappers/book-mapper";
import { validatePaginationDetails } from "../validators/common-validator";
import { generateUniquePath, localizeField } from "../utils/common-util";
import BookDocument from "../documents/book-document";
import { DEFAULT_LOCALE, Locale, SUPPORTED_LOCALES } from "../types/locale.types";
import DocumentStatus from "../enums/document-status";
import { v4 as uuidv4 } from 'uuid';
import { ActivationBookDto, CreateBookDto, UpdateBookDto } from "../validators/book-validator";

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
  const bookExists = await BookModel.exists({ _id: bookId, deleted: false });
  if (!bookExists) throw new AppError(`Book not found for id: ${bookId}`, 404);

  const titleTextEn = bookDto.title?.en?.trim();
  if (!titleTextEn) throw new AppError('Title must have en locale.', 400);

  // Duplicate title check — exclude current doc
  const existingDoc = await BookModel.findOne({
    'title.en': titleTextEn,
    _id:        { $ne: bookId }, // exclude the current doc
    deleted:    false,
  });
  if (existingDoc) {
    throw new AppError(`A book already exists with the title: "${titleTextEn}"`, 400);
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
  const updatedBookDoc = await BookModel.findOneAndUpdate(
    { _id: bookId, deleted: false },    // condition + existence check in one
    {
      $set: {
        status:    bookDto.status,
        updatedBy: appUser ?? undefined,
      },
      $inc: { __v: 1 },
    },
    { new: true }
  );

  if (!updatedBookDoc) {
    throw new AppError(`Cannot find the book with ID: ${bookId}.`, 404);
  }

  logger.info(`Book status updated for ID: ${bookId}`);
  return mapDocumentToBook(updatedBookDoc);
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
    previewImages: doc.previewImages ?? [],
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
