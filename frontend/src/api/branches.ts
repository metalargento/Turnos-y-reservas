import { apiClient } from './client';
import type { Branch, BranchCreateRequest, BranchUpdateRequest } from '../types';

export const branchesApi = {
  list: (businessId: string) =>
    apiClient.get<{ branches: Branch[]; count: number }>(`/api/branches/${businessId}`),

  create: (businessId: string, data: BranchCreateRequest) =>
    apiClient.post<Branch>(`/api/branches/${businessId}`, data),

  update: (branchId: string, data: BranchUpdateRequest) =>
    apiClient.put<Branch>(`/api/branches/${branchId}`, data),

  deactivate: (branchId: string) =>
    apiClient.delete(`/api/branches/${branchId}`),
};
