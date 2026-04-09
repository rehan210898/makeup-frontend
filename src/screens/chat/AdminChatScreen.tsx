import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { COLORS } from '../../constants';
import { FONTS } from '../../constants/fonts';
import { useChatStore, AdminChatSession } from '../../store/chatStore';
import { useUserStore } from '../../store/userStore';
import AdminChatService from '../../services/AdminChatService';

export default function AdminChatScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isAdmin = useUserStore((s) => s.user?.isAdmin);
  const activeSessions = useChatStore((s) => s.activeSessions);
  const adminService = AdminChatService.getInstance();

  useEffect(() => {
    if (!isAdmin) return;
    adminService.connect();
    return () => adminService.disconnect();
  }, [isAdmin]);

  const openSession = useCallback(
    (session: AdminChatSession) => {
      navigation.navigate('AdminConversation', {
        sessionId: session.sessionId,
        userName: session.userName,
      });
    },
    [navigation]
  );

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.accessDenied}>
          <Ionicons name="lock-closed" size={48} color={COLORS.gray[400]} />
          <Text style={styles.accessDeniedText}>Admin access required</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderSession = ({ item }: { item: AdminChatSession }) => (
    <TouchableOpacity style={styles.sessionCard} onPress={() => openSession(item)}>
      <View style={styles.sessionHeader}>
        <View style={styles.sessionUser}>
          <View style={[styles.avatar, item.disconnected && styles.avatarDisconnected]}>
            <Text style={styles.avatarText}>
              {(item.userName || 'G')[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.sessionInfo}>
            <Text style={styles.userName}>{item.userName || 'Guest'}</Text>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage || 'No messages yet'}
            </Text>
          </View>
        </View>
        <View style={styles.sessionMeta}>
          <Text style={styles.timeText}>{formatRelativeTime(item.lastMessageTime)}</Text>
          {!item.hasAgent && (
            <View style={styles.waitingBadge}>
              <Text style={styles.waitingText}>Waiting</Text>
            </View>
          )}
          {item.messageCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{item.messageCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Chat Sessions</Text>
        <View style={styles.sessionCountContainer}>
          <Text style={styles.sessionCount}>{activeSessions.length}</Text>
        </View>
      </View>

      {activeSessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color={COLORS.gray[300]} />
          <Text style={styles.emptyTitle}>No active chats</Text>
          <Text style={styles.emptySubtitle}>
            When customers start a live chat, they'll appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={activeSessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.sessionId}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
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
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: FONTS.display.semiBold,
    color: COLORS.text.primary,
  },
  sessionCountContainer: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  sessionCount: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: FONTS.display.bold,
  },
  list: {
    padding: 12,
  },
  sessionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarDisconnected: {
    backgroundColor: COLORS.gray[400],
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: FONTS.display.bold,
  },
  sessionInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontFamily: FONTS.display.semiBold,
    color: COLORS.text.primary,
  },
  lastMessage: {
    fontSize: 13,
    fontFamily: FONTS.display.regular,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  sessionMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    fontFamily: FONTS.display.regular,
    color: COLORS.gray[500],
  },
  waitingBadge: {
    backgroundColor: COLORS.warning,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  waitingText: {
    color: COLORS.white,
    fontSize: 10,
    fontFamily: FONTS.display.bold,
  },
  countBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    color: COLORS.white,
    fontSize: 10,
    fontFamily: FONTS.display.bold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: FONTS.display.semiBold,
    color: COLORS.text.primary,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: FONTS.display.regular,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  accessDeniedText: {
    fontSize: 16,
    fontFamily: FONTS.display.medium,
    color: COLORS.gray[500],
  },
});
