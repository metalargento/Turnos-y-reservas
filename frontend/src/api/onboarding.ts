import { apiClient } from './client';
import type {
  Business,
  OnboardingProgress,
  BusinessStepRequest,
  BrandStepRequest,
  BranchStepRequest,
  ServicesStepRequest,
  AgendaStepRequest,
  Service,
  Branch,
} from '../types';

export const onboardingApi = {
  getMyBusiness: async (): Promise<{ business: Business | null; has_business: boolean }> => {
    const response = await apiClient.get('/api/onboarding/my-business');
    return response.data;
  },

  getProgress: async (businessId: string): Promise<OnboardingProgress> => {
    const response = await apiClient.get<OnboardingProgress>(`/api/onboarding/${businessId}/progress`);
    return response.data;
  },

  step1CreateBusiness: async (data: BusinessStepRequest): Promise<Business & { access_token: string }> => {
    const response = await apiClient.post('/api/onboarding/step-1', data);
    return response.data;
  },

  step2UpdateBrand: async (businessId: string, data: BrandStepRequest): Promise<BrandStepRequest> => {
    const response = await apiClient.put(`/api/onboarding/step-2/${businessId}`, data);
    return response.data;
  },

  step3CreateBranch: async (businessId: string, data: BranchStepRequest): Promise<Branch> => {
    const response = await apiClient.post(`/api/onboarding/step-3/${businessId}`, data);
    return response.data;
  },

  step4CreateServices: async (businessId: string, data: ServicesStepRequest): Promise<{ services: Service[]; count: number }> => {
    const response = await apiClient.post(`/api/onboarding/step-4/${businessId}`, data);
    return response.data;
  },

  step5UpdateAgenda: async (businessId: string, data: AgendaStepRequest): Promise<Business> => {
    const response = await apiClient.put(`/api/onboarding/step-5/${businessId}`, data);
    return response.data;
  },
};
