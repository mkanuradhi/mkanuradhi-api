export default interface PaginatedResult<T> {
  message?: string;
  items: T[];
  pagination: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    currentPageSize: number;
  }
}