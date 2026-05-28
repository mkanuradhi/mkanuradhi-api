import { NextFunction, Request, Response } from "express";
import asyncErrorHandler from "../utils/async-error-handler";
import * as bookService from "../services/book-service";
import PaginatedResult from "../interfaces/i-paginated-result";
import Book from "../interfaces/i-book";
import { parseLangQueryParam } from "../utils/common-util";

export const createBook = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const addedBook = await bookService.createBook(req.body, req.appUser);
  res.status(201).json(addedBook);
});

export const getBooks = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 0;
  const size = Math.min(parseInt(req.query.size as string) || 10, 200);

  const { items, totalCount } = await bookService.getBooks(page, size);
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / size) : 1;

  const result: PaginatedResult<Book> = {
    items,
    pagination: {
      totalCount,
      totalPages,
      currentPage: page,
      currentPageSize: items.length,
    },
  };

  res.status(200).json(result);
});

export const updateBook = asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
  const bookId = req.params.id;
  const updatedBook = await bookService.updateBook(bookId, req.body, req.appUser);
  res.status(200).json(updatedBook);
});

export const getBook = asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
  const bookId = req.params.id;
  const book = await bookService.getBook(bookId);
  res.status(200).json(book);
});

export const getBookByPath = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const lang: string = parseLangQueryParam(req);
  const bookPath = req.params.path;
  const book = await bookService.getBookByPath(lang, bookPath);
  res.status(200).json(book);
});

export const deleteBook = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const bookId = req.params.id;
  await bookService.deleteBook(bookId, req.appUser);
  res.status(204).json();
});
