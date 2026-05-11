import { apiClient } from './client';
import type { Service, ServiceCreateRequest, ServiceUpdateRequest } from '../types';

export const servicesApi = {
  list: (businessId: string) =>
    apiClient.get<{ services: Service[]; count: number }>(`/api/services/${businessId}`),

  create: (businessId: string, data: ServiceCreateRequest) =>
    apiClient.post<Service>(`/api/services/${businessId}`, data),

  update: (serviceId: string, data: ServiceUpdateRequest) =>
    apiClient.put<Service>(`/api/services/${serviceId}`, data),

  deactivate: (serviceId: string) =>
    apiClient.delete(`/api/services/${serviceId}`),
};
