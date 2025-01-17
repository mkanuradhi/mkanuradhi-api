export interface SearchParamsDto {
  query?: string;
  page?: number;
  size?: number;
  published?: boolean;
  sort?: string;
}