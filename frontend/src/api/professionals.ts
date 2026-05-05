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
      `/professionals/${businessId}`
    ),

  create: (businessId: string, data: ProfessionalCreateRequest) =>
    apiClient.post<Professional>(`/professionals/${businessId}`, data),

  update: (professionalId: string, data: ProfessionalUpdateRequest) =>
    apiClient.put<Professional>(`/professionals/${professionalId}`, data),

  deactivate: (professionalId: string) =>
    apiClient.delete(`/professionals/${professionalId}`),

  assignServices: (professionalId: string, data: AssignServicesRequest) =>
    apiClient.put(`/professionals/${professionalId}/services`, data),
};
