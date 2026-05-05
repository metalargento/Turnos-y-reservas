import { apiClient } from './client';
import type { Branch, BranchCreateRequest, BranchUpdateRequest } from '../types';

export const branchesApi = {
  list: (businessId: string) =>
    apiClient.get<{ branches: Branch[]; count: number }>(`/branches/${businessId}`),

  create: (businessId: string, data: BranchCreateRequest) =>
    apiClient.post<Branch>(`/branches/${businessId}`, data),

  update: (branchId: string, data: BranchUpdateRequest) =>
    apiClient.put<Branch>(`/branches/${branchId}`, data),

  deactivate: (branchId: string) =>
    apiClient.delete(`/branches/${branchId}`),
};
