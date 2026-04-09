import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../constants';
import { useUserStore } from '../store/userStore';
import { useChatStore, LiveChatMessage, AdminChatSession } from '../store/chatStore';

class AdminChatService {
  private socket: Socket | null = null;
  private static instance: AdminChatService;

  static getInstance(): AdminChatService {
    if (!AdminChatService.instance) {
      AdminChatService.instance = new AdminChatService();
    }
    return AdminChatService.instance;
  }

  connect(): void {
    if (this.socket?.connected) return;

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
    });

    this.setupListeners();
  }

  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('admin:chat_list', (sessions: AdminChatSession[]) => {
      useChatStore.setState({ activeSessions: sessions });
    });

    this.socket.on('admin:new_chat', () => {
      // Session list will be updated via admin:chat_list
    });

    this.socket.on('admin:session_updated', () => {
      // Session list will be updated via admin:chat_list
    });

    this.socket.on('admin:user_disconnected', () => {
      // Session list will be updated via admin:chat_list
    });
  }

  acceptChat(sessionId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('admin:accept_chat', { sessionId });
  }

  // Listen for chat history after accepting
  onChatHistory(callback: (data: { sessionId: string; userName: string; history: LiveChatMessage[] }) => void): void {
    this.socket?.on('admin:chat_history', callback);
  }

  // Listen for incoming user messages
  onUserMessage(callback: (data: { sessionId: string; message: LiveChatMessage }) => void): void {
    this.socket?.on('admin:user_message', callback);
  }

  // Listen for user typing
  onUserTyping(callback: (data: { sessionId: string }) => void): void {
    this.socket?.on('admin:user_typing', callback);
  }

  sendMessage(sessionId: string, message: string): void {
    if (!this.socket?.connected || !message.trim()) return;
    this.socket.emit('admin:message', { sessionId, message: message.trim() });
  }

  sendTyping(sessionId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('admin:typing', { sessionId });
  }

  removeListeners(): void {
    this.socket?.removeAllListeners('admin:chat_history');
    this.socket?.removeAllListeners('admin:user_message');
    this.socket?.removeAllListeners('admin:user_typing');
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default AdminChatService;
