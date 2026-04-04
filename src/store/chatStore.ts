import { create } from 'zustand';

export interface ChatProduct {
  id: number;
  name: string;
  price: string;
  regular_price: string;
  sale_price: string | null;
  on_sale: boolean;
  in_stock: boolean;
  description: string;
  image: string | null;
  rating: string | null;
  category: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  products?: ChatProduct[];
  isHuman?: boolean;
}

interface ChatState {
  connected: boolean;
  sessionId: string | null;
  error: string | null;
  mode: 'AI' | 'HUMAN' | 'PENDING_HUMAN';
  messages: ChatMessage[];
  aiTyping: boolean;
  streaming: boolean;

  setConnected: (connected: boolean) => void;
  setSessionId: (id: string) => void;
  setMode: (mode: 'AI' | 'HUMAN' | 'PENDING_HUMAN') => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  finalizeMessage: (message: ChatMessage) => void;
  appendToStream: (id: string, chunk: string) => void;
  setAiTyping: (typing: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  connected: false,
  sessionId: null,
  error: null,
  mode: 'AI' as const,
  messages: [] as ChatMessage[],
  aiTyping: false,
  streaming: false,
};

export const useChatStore = create<ChatState>()((set) => ({
  ...initialState,

  setConnected: (connected) => set({ connected }),

  setSessionId: (sessionId) => set({ sessionId }),

  setMode: (mode) => set({ mode }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
    aiTyping: false,
  })),

  /**
   * Replace a streamed message (same ID) with the final version from the server.
   * The final version includes products[]. If no match by ID, add only if
   * content doesn't duplicate an existing message.
   */
  finalizeMessage: (message) => set((state) => {
    const idx = state.messages.findIndex(m => m.id === message.id);
    if (idx !== -1) {
      const updated = [...state.messages];
      updated[idx] = message; // replace with full version (has products)
      return { messages: updated };
    }
    // Avoid adding if same content already shown (dedup)
    const dup = state.messages.some(
      m => m.role === message.role && m.content === message.content &&
           Math.abs(m.timestamp - message.timestamp) < 5000
    );
    if (dup) return state;
    return { messages: [...state.messages, message] };
  }),

  appendToStream: (id, chunk) => set((state) => {
    const idx = state.messages.findIndex(m => m.id === id);
    if (idx !== -1) {
      const updated = [...state.messages];
      updated[idx] = { ...updated[idx], content: updated[idx].content + chunk };
      return { messages: updated };
    }
    return {
      messages: [...state.messages, {
        id,
        role: 'assistant' as const,
        content: chunk,
        timestamp: Date.now(),
        products: [],
      }],
    };
  }),

  setAiTyping: (aiTyping) => set({ aiTyping }),

  setStreaming: (streaming) => set({ streaming }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));
