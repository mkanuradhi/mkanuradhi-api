import FormData from "form-data";
import axios, { AxiosResponse } from "axios";
import { ImgbbResponseDto } from "../dtos/imgbb-response-dto";
import AppError from "../errors/app-error";

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
    throw new AppError("Image upload failed. Please try again.", 500);
  }
};