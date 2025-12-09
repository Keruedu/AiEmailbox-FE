import apiClient from './api';

// For now let's define locally or assume shared types. But better to return 'any' or specific types until components are created.
// Actually, let's typesafe this.

export interface KanbanCardType {
  id: string;
  sender: string;
  subject: string;
  summary: string;
  preview: string;
  gmail_url: string;
  snoozed_until?: string;
  received_at: string;
}

export interface ColMeta {
  key: string;
  label: string;
}

export const kanbanService = {
  getKanban: async () => {
    const response = await apiClient.get<{ columns: Record<string, KanbanCardType[]> }>('/kanban');
    return response.data;
  },

  getMeta: async () => {
    const response = await apiClient.get<{ columns: ColMeta[] }>('/kanban/meta');
    return response.data;
  },

  moveCard: async (emailId: string, toStatus: string) => {
    const response = await apiClient.post('/kanban/move', { email_id: emailId, to_status: toStatus });
    return response.data;
  },

  snoozeCard: async (emailId: string, until: string) => {
    // until should be RFC3339 string
    const response = await apiClient.post('/kanban/snooze', { email_id: emailId, until });
    return response.data;
  },

  summarizeEmail: async (emailId: string) => {
    const response = await apiClient.post<{ ok: boolean; summary: string }>('/kanban/summarize', { email_id: emailId });
    return response.data;
  }
};
