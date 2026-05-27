import { apiClient } from './client';
import type { Business } from '../types';

export interface BusinessUpdateRequest {
  name?: string;
  rubro?: string;
  description?: string;
}

export const businessApi = {
  update: (businessId: string, data: BusinessUpdateRequest) =>
    apiClient.put<Business>(`/api/business/${businessId}`, data),
};
