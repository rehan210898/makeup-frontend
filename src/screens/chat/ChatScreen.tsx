import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { FONTS } from '../../constants/fonts';
import { useChatStore } from '../../store/chatStore';
import BotpressWebView from '../../components/chat/BotpressWebView';
import LiveChatView from '../../components/chat/LiveChatView';

export default function ChatScreen() {
  const navigation = useNavigation();
  const { botpressAvailable, checkStatus } = useChatStore();
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const liveChatActiveRef = useRef(false);

  useEffect(() => {
    checkStatus();

    // Poll every 60 seconds for status changes
    pollRef.current = setInterval(() => {
      // Don't switch back to Botpress if user is already in a live chat session
      if (!liveChatActiveRef.current) {
        checkStatus();
      }
    }, 60000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Track if live chat is active (don't switch mid-conversation)
  useEffect(() => {
    if (botpressAvailable === false) {
      liveChatActiveRef.current = true;
    }
  }, [botpressAvailable]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {botpressAvailable === false ? 'Live Support' : 'Chat Support'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {botpressAvailable === false ? 'Connected to an agent' : 'AI-powered assistance'}
          </Text>
        </View>
      </View>

      {/* Content */}
      {botpressAvailable === null ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Connecting...</Text>
        </View>
      ) : botpressAvailable ? (
        <BotpressWebView />
      ) : (
        <LiveChatView />
      )}
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
    backgroundColor: COLORS.white,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: FONTS.display.regular,
    color: COLORS.text.secondary,
  },
});
