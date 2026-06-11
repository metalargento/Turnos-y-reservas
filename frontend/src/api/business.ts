import { apiClient } from './client';
import type { Business } from '../types';

export interface BusinessUpdateRequest {
  name?: string;
  rubro?: string;
  description?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  instagram_url?: string;
  facebook_url?: string;
}

export const businessApi = {
  update: (businessId: string, data: BusinessUpdateRequest) =>
    apiClient.put<Business>(`/api/business/${businessId}`, data),
};
