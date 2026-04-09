import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants';
import { FONTS } from '../../constants/fonts';
import { LiveChatMessage } from '../../store/chatStore';

interface Props {
  message: LiveChatMessage;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <View style={styles.systemContainer}>
        <Text style={styles.systemText}>{message.content}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.agentContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.agentBubble]}>
        {message.agentName && !isUser && (
          <Text style={styles.agentName}>{message.agentName}</Text>
        )}
        <Text style={[styles.messageText, isUser ? styles.userText : styles.agentText]}>
          {message.content}
        </Text>
        <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.agentTimestamp]}>
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 16,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  agentContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  agentBubble: {
    backgroundColor: COLORS.gray[100],
    borderBottomLeftRadius: 4,
  },
  agentName: {
    fontSize: 11,
    fontFamily: FONTS.display.medium,
    color: COLORS.primary,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 15,
    fontFamily: FONTS.display.regular,
    lineHeight: 20,
  },
  userText: {
    color: COLORS.white,
  },
  agentText: {
    color: COLORS.text.primary,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    fontFamily: FONTS.display.regular,
  },
  userTimestamp: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'right',
  },
  agentTimestamp: {
    color: COLORS.gray[400],
  },
  systemContainer: {
    alignItems: 'center',
    marginVertical: 8,
    marginHorizontal: 32,
  },
  systemText: {
    fontSize: 12,
    fontFamily: FONTS.display.regular,
    color: COLORS.gray[500],
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
