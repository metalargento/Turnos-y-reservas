import { apiClient } from './client';

interface UploadResponse {
  url: string;
  message: string;
}

export const uploadApi = {
  async uploadLogo(businessId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('business_id', businessId);

    const response = await apiClient.post<UploadResponse>(
      '/api/upload/logo',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.url;
  },

  async uploadAvatar(professionalId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('professional_id', professionalId);

    const response = await apiClient.post<UploadResponse>(
      '/api/upload/avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.url;
  },
};
