import { apiClient } from './client';
import type { Service, ServiceCreateRequest, ServiceUpdateRequest } from '../types';

export const servicesApi = {
  list: (businessId: string) =>
    apiClient.get<{ services: Service[]; count: number }>(`/services/${businessId}`),

  create: (businessId: string, data: ServiceCreateRequest) =>
    apiClient.post<Service>(`/services/${businessId}`, data),

  update: (serviceId: string, data: ServiceUpdateRequest) =>
    apiClient.put<Service>(`/services/${serviceId}`, data),

  deactivate: (serviceId: string) =>
    apiClient.delete(`/services/${serviceId}`),
};
