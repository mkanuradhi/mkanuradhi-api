import { CreateBookDto, UpdateBookDto } from "../dtos/book-dto";
import AppUser from "../interfaces/i-app-user";
import AppError from "../errors/app-error";
import Book from "../interfaces/i-book";
import BookModel from "../models/book-model";
import logger from "../config/logger-config";
import { mapDocumentsToBooks, mapDocumentToBook } from "../mappers/book-mapper";
import { validatePaginationDetails } from "../validators/common-validator";

export const createBook = async (bookDto: CreateBookDto, appUser?: AppUser | null): Promise<Book> => {
  // duplicate check — path is the stable unique identifier
  const existingBookDoc = await BookModel.findOne({
    path: bookDto.path.trim(),
    deleted: false
  });
  if (existingBookDoc) {
      throw new AppError(`Existing book found for the path: ${bookDto.path}`, 400);
  }

  // isbn uniqueness check — only if provided
  if (bookDto.isbn) {
    const isbnConflict = await BookModel.findOne({ isbn: bookDto.isbn.trim() });
    if (isbnConflict) {
      throw new AppError(`A book already exists for ISBN: ${bookDto.isbn}`, 400);
    }
  }

  const bookDoc = await BookModel.create({
    title:         bookDto.title,
    subtitle:      bookDto.subtitle,
    description:   bookDto.description,
    content:       bookDto.content,
    subject:       bookDto.subject,
    authors:       bookDto.authors,
    writtenLang:   bookDto.writtenLang,
    path:          bookDto.path,
    publisher:     bookDto.publisher,
    publishedYear: bookDto.publishedYear,
    edition:       bookDto.edition,
    isbn:          bookDto.isbn,
    pages:         bookDto.pages,
    tags:          bookDto.tags,
    coverImage:    bookDto.coverImage,
    previewImages: bookDto.previewImages,
    buyLink:       bookDto.buyLink,
    pdfTeaser:     bookDto.pdfTeaser,
    featured:      bookDto.featured ?? false,
    displayOrder:  bookDto.displayOrder,
    createdBy:     appUser ?? undefined,
    updatedBy:     appUser ?? undefined,
  });

  logger.info(`Book created for ${bookDto.title.en}`);
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
          subject: 1,
          authors: 1,
          writtenLang: 1,
          path: 1,
          publisher: 1,
          publishedYear: 1,
          edition: 1,
          isbn: 1,
          pages: 1,
          tags: 1,
          coverImage: 1,
          buyLink: 1,
          pdfTeaser: 1,
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
  // check for duplicate path
  if (bookDto.path) {
    const pathConflict = await BookModel.findOne({
      path:    bookDto.path.trim(),
      _id:     { $ne: bookId },       // exclude the current doc
      deleted: false,
    });
    if (pathConflict) {
      throw new AppError(`A book already exists for path: ${bookDto.path}`, 400);
    }
  }
  // check for duplicate ISBN
  if (bookDto.isbn) {
    const isbnConflict = await BookModel.findOne({
      isbn: bookDto.isbn.trim(),
      _id:  { $ne: bookId },
    });
    if (isbnConflict) {
      throw new AppError(`A book already exists for ISBN: ${bookDto.isbn}`, 400);
    }
  }

  const bookDoc = await BookModel.findOneAndUpdate(
    { _id: bookId, __v: bookDto.v, deleted: false },  // atomic version check
    {
      title:         bookDto.title,
      subtitle:      bookDto.subtitle,
      description:   bookDto.description,
      content:       bookDto.content,
      subject:       bookDto.subject,
      authors:       bookDto.authors,
      writtenLang:   bookDto.writtenLang,
      path:          bookDto.path,
      publisher:     bookDto.publisher,
      publishedYear: bookDto.publishedYear,
      edition:       bookDto.edition,
      isbn:          bookDto.isbn,
      pages:         bookDto.pages,
      tags:          bookDto.tags,
      coverImage:    bookDto.coverImage,
      previewImages: bookDto.previewImages,
      buyLink:       bookDto.buyLink,
      pdfTeaser:     bookDto.pdfTeaser,
      featured:      bookDto.featured,
      displayOrder:  bookDto.displayOrder,
      updatedBy:     appUser ?? undefined,
      $inc: { __v: 1 },                         // increment version atomically
    },
    { new: true, runValidators: true }
  );

  if (!bookDoc) {
    // distinguish 404 vs 409
    const exists = await BookModel.exists({ _id: bookId, deleted: false });
    throw exists
      ? new AppError('Book was modified by another request. Please refresh and try again.', 409)
      : new AppError('Book not found', 404);
  }

  logger.info(`Book updated: ${bookId}`);
  return mapDocumentToBook(bookDoc);
}
