import api from './axios';
import { ApiResponse } from '../types/admin.types';

export interface BroadcastNotificationPayload {
  title: string;
  body: string;
  type?: string;
  targetRoles?: string[];
  targetUserIds?: number[];
  topic?: string;
}

export const adminNotificationsApi = {
  broadcast: async (payload: BroadcastNotificationPayload) => {
    const response = await api.post<ApiResponse<{ status: string; message: string }>>(
      '/api/admin/notifications/broadcast',
      payload
    );
    return response.data;
  },
};
