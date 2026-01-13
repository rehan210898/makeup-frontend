import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { AuthService } from '../../services/AuthService';
import { useUserStore } from '../../store/userStore';
import { COLORS } from '../../constants';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

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
      <Text style={styles.title}>Verify Your Email</Text>
      
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  emailText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.primary,
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  resendButton: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    width: '80%',
    alignItems: 'center',
    marginBottom: 10,
  },
  resendText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 15,
  },
  backText: {
    color: '#666',
  }
});
