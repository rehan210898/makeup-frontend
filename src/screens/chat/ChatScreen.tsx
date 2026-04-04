import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { FONTS } from '../../constants/fonts';
import { useChatStore, ChatMessage, ChatProduct } from '../../store/chatStore';
import ChatSocketService from '../../services/ChatSocketService';

// ─── Product Card (inline, for AI suggestions) ──────────────────────

function ProductCard({ product, onPress }: { product: ChatProduct; onPress: () => void }) {
  return (
    <Pressable style={styles.productCard} onPress={onPress}>
      {product.image && (
        <Image source={{ uri: product.image }} style={styles.productImage} />
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <View style={styles.priceRow}>
          {product.on_sale && product.sale_price ? (
            <>
              <Text style={styles.salePrice}>{product.sale_price} AED</Text>
              <Text style={styles.originalPrice}>{product.regular_price} AED</Text>
            </>
          ) : (
            <Text style={styles.productPrice}>{product.price} AED</Text>
          )}
        </View>
        <Text style={[styles.stockBadge, { color: product.in_stock ? COLORS.success : COLORS.error }]}>
          {product.in_stock ? 'In Stock' : 'Out of Stock'}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────

function TypingIndicator() {
  return (
    <View style={[styles.messageBubble, styles.assistantBubble, { paddingVertical: 12 }]}>
      <View style={styles.typingDots}>
        {[0, 1, 2].map(i => (
          <View key={i} style={[styles.dot, { opacity: 0.4 + (i * 0.2) }]} />
        ))}
      </View>
    </View>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────

function MessageBubble({ item, onProductPress }: { item: ChatMessage; onProductPress: (id: number) => void }) {
  if (item.role === 'system') {
    return (
      <View style={styles.systemMessage}>
        <Text style={styles.systemText}>{item.content}</Text>
      </View>
    );
  }

  const isUser = item.role === 'user';

  return (
    <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>M</Text>
        </View>
      )}
      <View style={{ maxWidth: '78%' }}>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {item.content}
          </Text>
        </View>
        {/* Product cards */}
        {item.products && item.products.length > 0 && (
          <View style={styles.productsContainer}>
            {item.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={() => onProductPress(product.id)}
              />
            ))}
          </View>
        )}
        <Text style={[styles.timestamp, isUser && styles.timestampUser]}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
}

// ─── Main Chat Screen ─────────────────────────────────────────────

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const flatListRef = useRef<FlatList>(null);
  const [inputText, setInputText] = useState('');
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    messages,
    mode,
    aiTyping,
    connected,
    error,
  } = useChatStore();

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    ChatSocketService.connect();
    return () => {
      // Don't disconnect — keep session alive for background
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, aiTyping]);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;
    ChatSocketService.sendMessage(text);
    setInputText('');
  }, [inputText]);

  const handleTyping = useCallback((text: string) => {
    setInputText(text);
    // Debounced typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      ChatSocketService.sendTyping();
    }, 500);
  }, []);

  const handleRequestHuman = useCallback(() => {
    ChatSocketService.requestHuman();
  }, []);

  const handleProductPress = useCallback((productId: number) => {
    navigation.navigate('ProductDetail', { productId });
  }, [navigation]);

  const renderItem = useCallback(({ item }: { item: ChatMessage }) => (
    <MessageBubble item={item} onProductPress={handleProductPress} />
  ), [handleProductPress]);

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  const modeLabel = mode === 'AI' ? 'Mia (AI Assistant)' : mode === 'HUMAN' ? 'Support Agent' : 'Connecting to support...';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>{'<'}</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{modeLabel}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: connected ? COLORS.online : COLORS.error }]} />
            <Text style={styles.statusText}>{connected ? 'Online' : 'Reconnecting...'}</Text>
          </View>
        </View>
        {mode === 'AI' && (
          <TouchableOpacity onPress={handleRequestHuman} style={styles.humanButton}>
            <Text style={styles.humanButtonText}>Support</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[styles.messagesList, { paddingBottom: 12 }]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={20}
        maxToRenderPerBatch={10}
        ListFooterComponent={aiTyping ? <TypingIndicator /> : null}
      />

      {/* Pending Human Banner */}
      {mode === 'PENDING_HUMAN' && (
        <View style={styles.pendingBanner}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.pendingText}>Waiting for a support agent...</Text>
        </View>
      )}

      {/* Input Area */}
      <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          style={styles.textInput}
          placeholder={mode === 'PENDING_HUMAN' ? 'Waiting for agent...' : 'Type a message...'}
          placeholderTextColor={COLORS.gray[400]}
          value={inputText}
          onChangeText={handleTyping}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          multiline
          maxLength={2000}
          editable={mode !== 'PENDING_HUMAN'}
        />
        <TouchableOpacity
          onPress={handleSend}
          style={[styles.sendButton, (!inputText.trim() || !connected) && styles.sendButtonDisabled]}
          disabled={!inputText.trim() || !connected}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSubtle,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 22,
    color: COLORS.primary,
    fontFamily: FONTS.display.bold,
  },
  headerCenter: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FONTS.display.semiBold,
    color: COLORS.text.primary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontFamily: FONTS.display.regular,
  },
  humanButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  humanButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: FONTS.display.semiBold,
  },
  // Error
  errorBanner: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    fontFamily: FONTS.display.medium,
  },
  // Messages
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  messageRowUser: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 18,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 13,
    fontFamily: FONTS.display.bold,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '100%',
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
    color: COLORS.text.primary,
    fontFamily: FONTS.display.regular,
  },
  userMessageText: {
    color: COLORS.white,
  },
  timestamp: {
    fontSize: 11,
    color: COLORS.text.secondary,
    marginTop: 4,
    fontFamily: FONTS.display.regular,
  },
  timestampUser: {
    textAlign: 'right',
  },
  // System messages
  systemMessage: {
    alignItems: 'center',
    marginVertical: 12,
  },
  systemText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontFamily: FONTS.display.medium,
    fontStyle: 'italic',
    textAlign: 'center',
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  // Typing indicator
  typingDots: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.gray[400],
  },
  // Products
  productsContainer: {
    marginTop: 8,
    gap: 8,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: COLORS.gray[100],
  },
  productInfo: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 13,
    fontFamily: FONTS.display.semiBold,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  productPrice: {
    fontSize: 14,
    fontFamily: FONTS.display.bold,
    color: COLORS.primary,
  },
  salePrice: {
    fontSize: 14,
    fontFamily: FONTS.display.bold,
    color: COLORS.error,
  },
  originalPrice: {
    fontSize: 12,
    fontFamily: FONTS.display.regular,
    color: COLORS.gray[400],
    textDecorationLine: 'line-through',
  },
  stockBadge: {
    fontSize: 11,
    fontFamily: FONTS.display.medium,
    marginTop: 2,
  },
  // Pending banner
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 10,
    backgroundColor: '#FEF3C7',
  },
  pendingText: {
    fontSize: 13,
    color: '#92400E',
    fontFamily: FONTS.display.medium,
  },
  // Input area
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15,
    fontFamily: FONTS.display.regular,
    color: COLORS.text.primary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: FONTS.display.semiBold,
  },
});
