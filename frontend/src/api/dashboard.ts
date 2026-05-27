import { apiClient } from './client';
import type { DashboardStats } from '../types';

export const dashboardApi = {
  getStats: (businessId: string) =>
    apiClient.get<DashboardStats>(`/api/dashboard/${businessId}`),
};
