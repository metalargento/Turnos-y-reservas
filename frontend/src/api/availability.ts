import { apiClient } from './client';
import type { Availability, ScheduleBlock, AvailabilityCreateRequest, ScheduleBlockCreateRequest } from '../types';

export const availabilityApi = {
  getAvailability: async (professionalId: string): Promise<{ data: { availabilities: Availability[] } }> => {
    const response = await apiClient.get(`/api/availability/${professionalId}`);
    return { data: response.data };
  },

  createAvailability: async (professionalId: string, data: AvailabilityCreateRequest): Promise<{ data: Availability }> => {
    const response = await apiClient.post(`/api/availability/${professionalId}`, data);
    return { data: response.data };
  },

  updateAvailability: async (availabilityId: string, data: AvailabilityCreateRequest): Promise<{ data: Availability }> => {
    const response = await apiClient.put(`/api/availability/${availabilityId}`, data);
    return { data: response.data };
  },

  deleteAvailability: async (availabilityId: string): Promise<void> => {
    await apiClient.delete(`/api/availability/${availabilityId}`);
  },

  getScheduleBlocks: async (professionalId: string): Promise<{ data: { blocks: ScheduleBlock[] } }> => {
    const response = await apiClient.get(`/api/schedule-blocks/${professionalId}`);
    return { data: response.data };
  },

  createScheduleBlock: async (professionalId: string, data: ScheduleBlockCreateRequest): Promise<{ data: ScheduleBlock }> => {
    const response = await apiClient.post(`/api/schedule-blocks/${professionalId}`, data);
    return { data: response.data };
  },

  deleteScheduleBlock: async (blockId: string): Promise<void> => {
    await apiClient.delete(`/api/schedule-blocks/${blockId}`);
  },
};
