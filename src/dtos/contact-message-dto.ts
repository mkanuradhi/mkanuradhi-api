
export interface CreateContactMessageDto {
  name: string,
  email: string,
  message: string,
  captchaToken: string;
}