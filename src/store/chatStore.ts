import { create } from 'zustand';
import api from '../services/api';

export interface LiveChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  agentName?: string;
}

export interface AdminChatSession {
  sessionId: string;
  userName: string;
  userId: number | null;
  lastMessage: string;
  lastMessageTime: string;
  hasAgent: boolean;
  agentName: string | null;
  messageCount: number;
  createdAt: string;
  disconnected: boolean;
}

interface ChatState {
  // Botpress availability
  botpressAvailable: boolean | null;
  botpressBotId: string | null;

  // Live chat state
  connected: boolean;
  sessionId: string | null;
  agentConnected: boolean;
  messages: LiveChatMessage[];
  agentTyping: boolean;
  error: string | null;

  // Admin state
  activeSessions: AdminChatSession[];

  // Actions
  checkStatus: () => Promise<void>;
  setConnected: (connected: boolean) => void;
  setSessionId: (sessionId: string | null) => void;
  setAgentConnected: (connected: boolean) => void;
  addMessage: (msg: LiveChatMessage) => void;
  setMessages: (messages: LiveChatMessage[]) => void;
  setAgentTyping: (typing: boolean) => void;
  setError: (error: string | null) => void;
  setActiveSessions: (sessions: AdminChatSession[]) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  botpressAvailable: null,
  botpressBotId: null,
  connected: false,
  sessionId: null,
  agentConnected: false,
  messages: [],
  agentTyping: false,
  error: null,
  activeSessions: [],

  checkStatus: async () => {
    try {
      const response = await api.get('/chat/status');
      set({
        botpressAvailable: response.data.botpressAvailable,
        botpressBotId: response.data.botpressBotId,
      });
    } catch {
      // If status check fails, default to live chat
      set({ botpressAvailable: false });
    }
  },

  setConnected: (connected) => set({ connected }),
  setSessionId: (sessionId) => set({ sessionId }),
  setAgentConnected: (agentConnected) => set({ agentConnected }),

  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg],
    })),

  setMessages: (messages) => set({ messages }),
  setAgentTyping: (agentTyping) => set({ agentTyping }),
  setError: (error) => set({ error }),
  setActiveSessions: (sessions) => set({ activeSessions: sessions }),

  reset: () =>
    set({
      connected: false,
      sessionId: null,
      agentConnected: false,
      messages: [],
      agentTyping: false,
      error: null,
    }),
}));
