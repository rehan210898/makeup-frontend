import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../constants';
import { useUserStore } from '../store/userStore';
import { useChatStore, ChatMessage } from '../store/chatStore';

// Socket URL — same server, no /api/v1 prefix for socket.io
const SOCKET_URL = API_CONFIG.BASE_URL.replace('/api/v1', '');

class ChatSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Connect to the chat server. Cleans up any stale socket first.
   */
  connect() {
    if (this.socket?.connected) return;

    // Clean up stale socket to prevent duplicate listeners
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    const token = useUserStore.getState().token;
    const user = useUserStore.getState().user;

    this.socket = io(SOCKET_URL, {
      auth: {
        token: token || undefined,
        apiKey: API_CONFIG.API_KEY,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    // Auto-join chat after connection
    this.socket.on('connect', () => {
      if (__DEV__) console.log('Chat socket connected');
      useChatStore.getState().setConnected(true);
      useChatStore.getState().setError(null);
      this.reconnectAttempts = 0;

      this.socket?.emit('chat:join', {
        userName: user?.firstName || user?.username || 'Guest',
      });
    });

    this.socket.on('disconnect', (reason) => {
      if (__DEV__) console.log('Chat socket disconnected:', reason);
      useChatStore.getState().setConnected(false);
    });

    this.socket.on('connect_error', (error) => {
      if (__DEV__) console.error('Chat socket error:', error.message);
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        useChatStore.getState().setError('Unable to connect to chat. Please try again later.');
      }
    });

    this.setupListeners();
  }

  /**
   * Set up all chat event listeners (called once per connect)
   */
  private setupListeners() {
    if (!this.socket) return;

    // Session joined — receive history
    this.socket.on('chat:joined', (data: {
      sessionId: string;
      mode: string;
      history: ChatMessage[];
    }) => {
      const store = useChatStore.getState();
      store.setSessionId(data.sessionId);
      store.setMode(data.mode as 'AI' | 'HUMAN' | 'PENDING_HUMAN');
      if (data.history && data.history.length > 0) {
        store.setMessages(data.history);
      } else if (store.messages.length === 0) {
        store.addMessage({
          id: 'welcome',
          role: 'assistant',
          content: "Hi! I'm Mia, your MakeupOcean beauty assistant. How can I help you today?",
          timestamp: Date.now(),
          products: [],
        });
      }
    });

    // Complete AI message (sent after streaming is done)
    this.socket.on('chat:message', (msg: ChatMessage) => {
      useChatStore.getState().finalizeMessage(msg);
    });

    // Streaming text chunks
    this.socket.on('chat:stream', (data: {
      id: string;
      chunk: string;
      done: boolean;
    }) => {
      const store = useChatStore.getState();
      if (data.done) {
        store.setStreaming(false);
        return;
      }
      store.setStreaming(true);
      store.setAiTyping(false); // stop typing dots once text starts streaming
      store.appendToStream(data.id, data.chunk);
    });

    // AI typing indicator
    this.socket.on('chat:ai_typing', (data: { typing: boolean }) => {
      useChatStore.getState().setAiTyping(data.typing);
    });

    // Human agent typing
    this.socket.on('chat:agent_typing', () => {
      const store = useChatStore.getState();
      store.setAiTyping(true);
      setTimeout(() => useChatStore.getState().setAiTyping(false), 3000);
    });

    // Mode changed (AI <-> Human)
    this.socket.on('chat:mode_changed', (data: { mode: string; message: string }) => {
      const store = useChatStore.getState();
      store.setMode(data.mode as 'AI' | 'HUMAN' | 'PENDING_HUMAN');
      store.addMessage({
        id: `system-${Date.now()}`,
        role: 'system',
        content: data.message,
        timestamp: Date.now(),
        products: [],
      });
    });

    // Human agent connected
    this.socket.on('chat:human_connected', (data: { message: string }) => {
      const store = useChatStore.getState();
      store.setMode('HUMAN');
      store.addMessage({
        id: `system-${Date.now()}`,
        role: 'system',
        content: data.message,
        timestamp: Date.now(),
        products: [],
      });
    });

    // Status messages
    this.socket.on('chat:status', (data: { message: string }) => {
      useChatStore.getState().addMessage({
        id: `status-${Date.now()}`,
        role: 'system',
        content: data.message,
        timestamp: Date.now(),
        products: [],
      });
    });

    // Errors
    this.socket.on('chat:error', (data: { message: string }) => {
      useChatStore.getState().setError(data.message);
    });
  }

  /**
   * Send a message to the chat
   */
  sendMessage(message: string) {
    if (!this.socket?.connected) {
      useChatStore.getState().setError('Not connected. Reconnecting...');
      this.connect();
      return;
    }

    // Add user message to local store immediately (optimistic)
    useChatStore.getState().addMessage({
      id: `local-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: Date.now(),
      products: [],
    });

    this.socket.emit('chat:message', { message });
  }

  requestHuman(reason?: string) {
    this.socket?.emit('chat:request_human', { reason: reason || 'User requested human support' });
  }

  sendTyping() {
    this.socket?.emit('chat:typing');
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    useChatStore.getState().reset();
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export default new ChatSocketService();
