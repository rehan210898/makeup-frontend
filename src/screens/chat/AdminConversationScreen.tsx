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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { COLORS } from '../../constants';
import { FONTS } from '../../constants/fonts';
import { LiveChatMessage } from '../../store/chatStore';
import AdminChatService from '../../services/AdminChatService';
import MessageBubble from '../../components/chat/MessageBubble';
import TypingIndicator from '../../components/chat/TypingIndicator';

export default function AdminConversationScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'AdminConversation'>>();
  const { sessionId, userName } = route.params;

  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [userTyping, setUserTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const adminService = AdminChatService.getInstance();

  useEffect(() => {
    // Accept the chat and get history
    adminService.acceptChat(sessionId);

    adminService.onChatHistory(({ history }) => {
      setMessages(history);
    });

    adminService.onUserMessage(({ message }) => {
      setMessages((prev) => [...prev, message]);
      setUserTyping(false);
    });

    adminService.onUserTyping(({ sessionId: sid }) => {
      if (sid === sessionId) {
        setUserTyping(true);
        setTimeout(() => setUserTyping(false), 3000);
      }
    });

    return () => {
      adminService.removeListeners();
    };
  }, [sessionId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    adminService.sendMessage(sessionId, input);

    // Optimistically add
    const msg: LiveChatMessage = {
      id: `admin_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      role: 'agent',
      content: input.trim(),
      timestamp: new Date().toISOString(),
      agentName: 'You',
    };
    setMessages((prev) => [...prev, msg]);
    setInput('');
  }, [input, sessionId]);

  const renderItem = useCallback(
    ({ item }: { item: LiveChatMessage }) => <MessageBubble message={item} />,
    []
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{userName || 'Guest'}</Text>
          <Text style={styles.headerSubtitle}>Live Chat Session</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
        />

        {userTyping && <TypingIndicator />}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Reply to customer..."
            placeholderTextColor={COLORS.gray[400]}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!input.trim()}
          >
            <Ionicons name="send" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.display.semiBold,
    color: COLORS.text.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.display.regular,
    color: COLORS.text.secondary,
    marginTop: 1,
  },
  chatArea: {
    flex: 1,
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
