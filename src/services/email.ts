import apiClient from './api';
import { USE_MOCK_API, mockEmailApi } from '@/mocks/api';
import { Mailbox, Email, EmailListResponse } from '@/types/email';

export const emailService = {
  // Get all mailboxes
  getMailboxes: async (): Promise<Mailbox[]> => {
    if (USE_MOCK_API) {
      const mockData = await mockEmailApi.getMailboxes();
      return mockData.mailboxes;
    }
    
    const response = await apiClient.get<{ mailboxes: Mailbox[] }>('/mailboxes');
    return response.data.mailboxes;
  },

  // Get emails for a specific mailbox
  getEmails: async (mailboxId: string, page: number = 1, perPage: number = 20): Promise<EmailListResponse> => {
    if (USE_MOCK_API) {
      return await mockEmailApi.getEmails(mailboxId, page, perPage);
    }
    
    const response = await apiClient.get<EmailListResponse>(`/mailboxes/${mailboxId}/emails`, {
      params: { page, perPage },
    });
    return response.data;
  },

  // Get email detail
  getEmailDetail: async (emailId: string): Promise<Email> => {
    if (USE_MOCK_API) {
      return await mockEmailApi.getEmailById(emailId);
    }
    
    const response = await apiClient.get<Email>(`/emails/${emailId}`);
    return response.data;
  },

  // Mark email as read
  markAsRead: async (emailId: string): Promise<void> => {
    if (USE_MOCK_API) {
      return await mockEmailApi.markAsRead(emailId);
    }
    
    await apiClient.patch(`/emails/${emailId}/read`);
  },

  // Toggle star on email
  toggleStar: async (emailId: string): Promise<void> => {
    if (USE_MOCK_API) {
      return await mockEmailApi.toggleStar(emailId);
    }
    
    await apiClient.patch(`/emails/${emailId}/star`);
  },

  // Delete email
  deleteEmail: async (emailId: string): Promise<void> => {
    if (USE_MOCK_API) {
      return await mockEmailApi.deleteEmail(emailId);
    }
    
    await apiClient.delete(`/emails/${emailId}`);
  },
};
