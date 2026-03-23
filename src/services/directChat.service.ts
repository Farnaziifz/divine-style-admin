import api from './api';

export type DirectConversationListItem = {
  id: string;
  user: { id: string; mobile: string; name: string | null; lastName: string | null };
  updatedAt: string;
  unreadCount: number;
  lastMessage: null | {
    id: string;
    authorRole: 'USER' | 'ADMIN' | 'OPERATOR';
    text: string | null;
    attachmentType: 'IMAGE' | 'AUDIO' | null;
    createdAt: string;
  };
};

export type DirectMessage = {
  id: string;
  authorRole: 'USER' | 'ADMIN' | 'OPERATOR';
  authorUserId: string | null;
  text: string | null;
  attachmentType: 'IMAGE' | 'AUDIO' | null;
  attachmentUrl: string | null;
  createdAt: string;
};

export const directChatService = {
  listConversations: async (params?: { q?: string; limit?: number }) => {
    const response = await api.get<DirectConversationListItem[]>(
      '/admin/direct/conversations',
      { params },
    );
    return response.data;
  },

  listMessages: async (conversationId: string, params?: { since?: string; limit?: number }) => {
    const response = await api.get<{ conversationId: string; messages: DirectMessage[] }>(
      `/admin/direct/conversations/${encodeURIComponent(conversationId)}/messages`,
      { params },
    );
    return response.data;
  },

  sendMessage: async (conversationId: string, data: { text?: string; file?: File; attachmentType?: 'IMAGE' | 'AUDIO' }) => {
    const form = new FormData();
    if (data.text) form.append('text', data.text);
    if (data.file) form.append('file', data.file);
    if (data.attachmentType) form.append('attachmentType', data.attachmentType);
    const response = await api.post<DirectMessage>(
      `/admin/direct/conversations/${encodeURIComponent(conversationId)}/messages`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },

  markRead: async (conversationId: string) => {
    const response = await api.patch(
      `/admin/direct/conversations/${encodeURIComponent(conversationId)}/mark-read`,
    );
    return response.data as { id: string };
  },
};

