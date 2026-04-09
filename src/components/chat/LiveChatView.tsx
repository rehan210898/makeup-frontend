import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { FONTS } from '../../constants/fonts';
import { useChatStore, LiveChatMessage } from '../../store/chatStore';
import { useUserStore } from '../../store/userStore';
import LiveChatSocketService from '../../services/LiveChatSocketService';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

export default function LiveChatView() {
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const user = useUserStore((s) => s.user);
  const { connected, sessionId, agentConnected, messages, agentTyping, error } = useChatStore();
  const socketService = LiveChatSocketService.getInstance();

  useEffect(() => {
    socketService.connect();

    // If we don't have an existing session, join a new one after connection
    const joinTimeout = setTimeout(() => {
      if (!useChatStore.getState().sessionId) {
        const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Guest' : 'Guest';
        socketService.joinChat(userName, user?.id);
      }
    }, 500);

    return () => {
      clearTimeout(joinTimeout);
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom on new messages
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(() => {
    if (!input.trim() || !sessionId) return;
    socketService.sendMessage(sessionId, input);
    setInput('');
  }, [input, sessionId]);

  const handleTyping = useCallback(() => {
    if (!sessionId) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketService.sendTyping(sessionId);
    typingTimeoutRef.current = setTimeout(() => {}, 2000);
  }, [sessionId]);

  const renderItem = useCallback(
    ({ item }: { item: LiveChatMessage }) => <MessageBubble message={item} />,
    []
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={[styles.statusDot, connected ? styles.online : styles.offline]} />
        <Text style={styles.statusText}>
          {!connected
            ? 'Connecting...'
            : agentConnected
            ? 'Agent connected'
            : 'Waiting for agent...'}
        </Text>
      </View>

      {error && (
        <View style={styles.errorBar}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
      />

      {agentTyping && <TypingIndicator />}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={(text) => {
            setInput(text);
            handleTyping();
          }}
          placeholder="Type a message..."
          placeholderTextColor={COLORS.gray[400]}
          multiline
          maxLength={1000}
          editable={connected}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || !connected) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || !connected}
        >
          <Ionicons name="send" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.backgroundSubtle,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  online: {
    backgroundColor: COLORS.success,
  },
  offline: {
    backgroundColor: COLORS.gray[400],
  },
  statusText: {
    fontSize: 13,
    fontFamily: FONTS.display.medium,
    color: COLORS.text.secondary,
  },
  errorBar: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  errorText: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: FONTS.display.regular,
  },
  messageList: {
    paddingVertical: 12,
    flexGrow: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    backgroundColor: COLORS.white,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.gray[100],
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: FONTS.display.regular,
    color: COLORS.text.primary,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.gray[300],
  },
});
