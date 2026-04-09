import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../constants';
import { useUserStore } from '../store/userStore';
import { useChatStore, LiveChatMessage } from '../store/chatStore';

class LiveChatSocketService {
  private socket: Socket | null = null;
  private static instance: LiveChatSocketService;

  static getInstance(): LiveChatSocketService {
    if (!LiveChatSocketService.instance) {
      LiveChatSocketService.instance = new LiveChatSocketService();
    }
    return LiveChatSocketService.instance;
  }

  connect(): void {
    if (this.socket?.connected) return;

    // Socket URL = base URL without /api/v1
    const socketUrl = API_CONFIG.BASE_URL.replace(/\/api\/v\d+$/, '');
    const token = useUserStore.getState().token;

    this.socket = io(socketUrl, {
      auth: {
        token: token || '',
        apiKey: API_CONFIG.API_KEY,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupListeners();
  }

  private setupListeners(): void {
    if (!this.socket) return;
    const store = useChatStore.getState;

    this.socket.on('connect', () => {
      useChatStore.setState({ connected: true, error: null });

      // Auto-reconnect to existing session if we have one
      const existingSessionId = useChatStore.getState().sessionId;
      if (existingSessionId) {
        this.reconnectChat(existingSessionId);
      }
    });

    this.socket.on('disconnect', () => {
      useChatStore.setState({ connected: false });
    });

    this.socket.on('connect_error', (err) => {
      useChatStore.setState({ error: `Connection failed: ${err.message}` });
    });

    this.socket.on('livechat:joined', ({ sessionId, message }) => {
      useChatStore.setState({ sessionId });
      if (message) {
        const systemMsg: LiveChatMessage = {
          id: `sys_${Date.now()}`,
          role: 'system',
          content: message,
          timestamp: new Date().toISOString(),
        };
        store().addMessage(systemMsg);
      }
    });

    this.socket.on('livechat:reconnected', ({ sessionId, history, agentConnected }) => {
      useChatStore.setState({
        sessionId,
        messages: history || [],
        agentConnected: !!agentConnected,
      });
    });

    this.socket.on('livechat:error', ({ message }) => {
      // Session expired during reconnect — reset and join fresh
      useChatStore.setState({ sessionId: null });
      useChatStore.getState().setError(message);
    });

    this.socket.on('livechat:message', (msg: LiveChatMessage) => {
      store().addMessage(msg);
      store().setAgentTyping(false);
    });

    this.socket.on('livechat:agent_connected', ({ agentName }) => {
      useChatStore.setState({ agentConnected: true });
      const systemMsg: LiveChatMessage = {
        id: `sys_agent_${Date.now()}`,
        role: 'system',
        content: `${agentName || 'An agent'} has joined the chat.`,
        timestamp: new Date().toISOString(),
      };
      store().addMessage(systemMsg);
    });

    this.socket.on('livechat:agent_typing', () => {
      store().setAgentTyping(true);
      // Auto-clear typing after 3 seconds
      setTimeout(() => store().setAgentTyping(false), 3000);
    });
  }

  joinChat(userName: string, userId?: number): void {
    if (!this.socket?.connected) return;
    this.socket.emit('livechat:join', { userName, userId });
  }

  reconnectChat(sessionId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('livechat:reconnect', { sessionId });
  }

  sendMessage(sessionId: string, message: string): void {
    if (!this.socket?.connected || !message.trim()) return;
    this.socket.emit('livechat:message', { sessionId, message: message.trim() });

    // Optimistically add to store
    const msg: LiveChatMessage = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString(),
    };
    useChatStore.getState().addMessage(msg);
  }

  sendTyping(sessionId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('livechat:typing', { sessionId });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    useChatStore.getState().reset();
  }
}

export default LiveChatSocketService;
