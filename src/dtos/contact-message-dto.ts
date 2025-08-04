
export interface CreateContactMessageDto {
  name: string,
  email: string,
  message: string,
  captchaToken: string;
  userAgent?: string;
  screen?: string;
  timezone?: string;
  language?: string;
  ipAddress?: string;
}