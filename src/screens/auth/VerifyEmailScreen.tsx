import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, Platform } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { AuthService } from '../../services/AuthService';
import { useUserStore } from '../../store/userStore';
import { COLORS } from '../../constants';
import { FONTS } from '../../constants/fonts';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ArrowLeftIcon from '../../components/icons/ArrowLeftIcon';
import { Feather } from '@expo/vector-icons';

type VerifyScreenRouteProp = RouteProp<RootStackParamList, 'VerifyEmail'>;
type VerifyScreenNavProp = NativeStackNavigationProp<RootStackParamList>;

export default function VerifyEmailScreen() {
  const route = useRoute<VerifyScreenRouteProp>();
  const navigation = useNavigation<VerifyScreenNavProp>();
  const { email, token: initialToken, password } = route.params;
  
  const [loading, setLoading] = useState(!!initialToken);
  const [resending, setResending] = useState(false);
  const { setUser } = useUserStore();

  // Polling for auto-login (e.g., if verified on another device)
  useEffect(() => {
    if (initialToken) return; // If we have a token, we rely on verifyToken instead
    if (!password) return; // Can't auto-login without password

    let isMounted = true;
    const pollInterval = setInterval(async () => {
        try {
            // Attempt silent login
            const data = await AuthService.login({ email, password });
            if (data.success && isMounted) {
                clearInterval(pollInterval);
                setUser(data.user, data.token);
                Alert.alert('Success', 'Email verified! Logging you in...');
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'MainTabs' }],
                });
            }
        } catch (error) {
            // Ignore login failures (expected while unverified)
        }
    }, 3000); // Check every 3 seconds

    return () => {
        isMounted = false;
        clearInterval(pollInterval);
    };
  }, [email, password, initialToken]);

  useEffect(() => {
    if (initialToken) {
      verifyToken(initialToken);
    }
  }, [initialToken]);

  const verifyToken = async (token: string) => {
    setLoading(true);
    try {
      const data = await AuthService.verifyEmailToken(token);
      if (data.success) {
        setUser(data.user, data.token);
        Alert.alert('Success', 'Email verified successfully!');
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      }
    } catch (error: any) {
      Alert.alert('Verification Failed', error.message || 'Invalid token');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await AuthService.resendVerification(email);
      Alert.alert('Sent', 'Verification email sent again.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend');
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backBtn}>
          <ArrowLeftIcon size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify Email</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Feather name="mail" size={48} color={COLORS.primary} />
          </View>
          
          <Text style={styles.title}>Check your Inbox</Text>
          
          <Text style={styles.text}>
            We sent a verification link to:
          </Text>
          <Text style={styles.emailText}>{email}</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Verifying...</Text>
            </View>
          ) : (
            <View style={styles.actionContainer}>
              <Text style={styles.infoText}>
                Click the link in your email to continue.
              </Text>

              <TouchableOpacity 
                style={styles.resendButton} 
                onPress={handleResend}
                disabled={resending}
              >
                {resending ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : (
                  <Text style={styles.resendText}>Resend Email</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.backText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.serif.bold,
    color: COLORS.text.main,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    padding: 30,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.backgroundSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.serif.bold,
    color: COLORS.primary,
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: 5,
    fontFamily: FONTS.display.regular,
  },
  emailText: {
    fontSize: 18,
    fontFamily: FONTS.display.bold,
    color: COLORS.text.main,
    marginBottom: 30,
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.primary,
    fontFamily: FONTS.display.medium,
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text.muted,
    marginBottom: 24,
    fontFamily: FONTS.display.regular,
    textAlign: 'center',
  },
  resendButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  resendText: {
    color: COLORS.primary,
    fontSize: 16,
    fontFamily: FONTS.display.bold,
  },
  backButton: {
    padding: 10,
  },
  backText: {
    color: COLORS.text.secondary,
    fontFamily: FONTS.display.medium,
    fontSize: 14,
  }
});
