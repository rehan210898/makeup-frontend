import api from './api';
import { AdminChatSession } from '../store/chatStore';

export const ChatApiService = {
  getStatus: async (): Promise<{ botpressAvailable: boolean; botpressBotId: string | null }> => {
    const response = await api.get('/chat/status');
    return response.data;
  },

  getAdminSessions: async (): Promise<AdminChatSession[]> => {
    const response = await api.get('/chat/admin/sessions');
    return response.data.sessions || [];
  },
};
