import { CreateBookDto, UpdateBookDto } from "../dtos/book-dto";
import AppUser from "../interfaces/i-app-user";
import AppError from "../errors/app-error";
import Book from "../interfaces/i-book";
import BookModel from "../models/book-model";
import logger from "../config/logger-config";
import { mapDocumentsToBooks, mapDocumentToBook } from "../mappers/book-mapper";
import { validatePaginationDetails } from "../validators/common-validator";
import { generateUniquePath } from "../utils/common-util";

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

  // isbn uniqueness check — only if provided
  if (bookDto.isbn) {
    const isbnConflict = await BookModel.findOne({ isbn: bookDto.isbn.trim() });
    if (isbnConflict) {
      throw new AppError(`A book already exists for ISBN: ${bookDto.isbn}`, 400);
    }
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
