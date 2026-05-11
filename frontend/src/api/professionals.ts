import { apiClient } from './client';
import type {
  Professional,
  ProfessionalCreateRequest,
  ProfessionalUpdateRequest,
  AssignServicesRequest,
} from '../types';

export const professionalsApi = {
  list: (businessId: string) =>
    apiClient.get<{ professionals: Professional[]; count: number }>(
      `/api/professionals/${businessId}`
    ),

  create: (businessId: string, data: ProfessionalCreateRequest) =>
    apiClient.post<Professional>(`/api/professionals/${businessId}`, data),

  update: (professionalId: string, data: ProfessionalUpdateRequest) =>
    apiClient.put<Professional>(`/api/professionals/${professionalId}`, data),

  deactivate: (professionalId: string) =>
    apiClient.delete(`/api/professionals/${professionalId}`),

  assignServices: (professionalId: string, data: AssignServicesRequest) =>
    apiClient.put(`/api/professionals/${professionalId}/services`, data),
};
