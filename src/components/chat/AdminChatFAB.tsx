import React, { useEffect } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { COLORS } from '../../constants';
import { FONTS } from '../../constants/fonts';
import { useChatStore } from '../../store/chatStore';
import { haptic } from '../../utils/haptics';
import AdminChatService from '../../services/AdminChatService';

export default function AdminChatFAB() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const sessionCount = useChatStore((s) => s.activeSessions.length);
  const waitingCount = useChatStore((s) =>
    s.activeSessions.filter((sess) => !sess.hasAgent).length
  );

  useEffect(() => {
    // Keep admin service connected for real-time session count
    const service = AdminChatService.getInstance();
    service.connect();
    return () => service.disconnect();
  }, []);

  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={() => {
        haptic.light();
        navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('AdminChat')
          ?? navigation.navigate('AdminChat' as any);
      }}
      activeOpacity={0.85}
    >
      <Ionicons name="headset" size={22} color={COLORS.white} />
      {waitingCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{waitingCount > 99 ? '99+' : waitingCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 164 : 144,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontFamily: FONTS.display.bold,
  },
});
