import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { COLORS, API_CONFIG } from '../../constants';
import { FONTS } from '../../constants/fonts';
import { RootStackParamList } from '../../navigation/types';
import { AuthService } from '../../services/AuthService';
import { useUserStore } from '../../store/userStore';
import { User } from '../../types';
import PasswordInput from '../../components/common/PasswordInput';
import { Feather } from '@expo/vector-icons';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID_WEB = '';
const GOOGLE_CLIENT_ID_IOS = '';
const GOOGLE_CLIENT_ID_ANDROID = '';

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { setUser, isAuthenticated } = useUserStore();

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_CLIENT_ID_WEB,
    iosClientId: GOOGLE_CLIENT_ID_IOS,
    androidClientId: GOOGLE_CLIENT_ID_ANDROID,
    scopes: ['profile', 'email'],
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    }
  }, [isAuthenticated, navigation]);

  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleToken(response.authentication?.accessToken);
    } else if (response?.type === 'error') {
      setGoogleLoading(false);
      Alert.alert('Error', response.error?.message || 'Google Sign In failed');
    } else if (response?.type === 'cancel') {
      setGoogleLoading(false);
    }
  }, [response]);

  const handleGoogleToken = async (accessToken: string | undefined) => {
    if (!accessToken) {
      setGoogleLoading(false);
      Alert.alert('Error', 'No access token received');
      return;
    }

    try {
      const result = await AuthService.googleLogin(accessToken);

      if (result.success && result.user && result.token) {
        setUser(result.user, result.token);
        Alert.alert('Success', `Welcome, ${result.user.firstName}!`);
      } else {
        Alert.alert('Error', result.message || 'Google login failed');
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      Alert.alert('Error', error.message || 'Failed to complete Google Sign In');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginInput || !password) {
      Alert.alert('Error', 'Please enter email/username and password');
      return;
    }

    setLoading(true);
    try {
      const data = await AuthService.login({ login: loginInput, password });

      if (data.success) {
        setUser(data.user, data.token);
        Alert.alert('Success', `Welcome back, ${data.user.firstName}!`);
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = useCallback(async () => {
    const hasClientIds = GOOGLE_CLIENT_ID_WEB || GOOGLE_CLIENT_ID_ANDROID || GOOGLE_CLIENT_ID_IOS;

    if (!hasClientIds || !request) {
      handleGoogleLoginFallback();
      return;
    }

    setGoogleLoading(true);
    try {
      await promptAsync();
    } catch (error) {
      setGoogleLoading(false);
      console.error('Google prompt error:', error);
      handleGoogleLoginFallback();
    }
  }, [request, promptAsync]);

  const handleGoogleLoginFallback = async () => {
    try {
      setGoogleLoading(true);
      const redirectUrl = 'muoapp://auth-callback';
      const authUrl = `${API_CONFIG.BASE_URL}/auth/google?redirect_scheme=muoapp`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const token = url.searchParams.get('token');
        const uId = url.searchParams.get('uId');

        if (token && uId) {
          const user: User = {
            id: parseInt(uId),
            email: url.searchParams.get('email') || '',
            firstName: url.searchParams.get('firstName') || '',
            lastName: url.searchParams.get('lastName') || '',
            username: url.searchParams.get('username') || '',
            avatar: url.searchParams.get('avatar') || undefined,
            billing: undefined,
            shipping: undefined
          };

          setUser(user, token);
          Alert.alert('Success', `Welcome back, ${user.firstName}!`);
        } else {
          Alert.alert('Error', 'Invalid response from Google Login.');
        }
      }
    } catch (error) {
      console.error('Google fallback error:', error);
      Alert.alert('Error', 'Google Sign In failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      await WebBrowser.openBrowserAsync('https://makeupocean.com/my-account/lost-password/');
    } catch (error) {
      Alert.alert('Error', 'Could not open password reset page');
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue shopping</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email or Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email or username"
                placeholderTextColor={COLORS.text.muted}
                value={loginInput}
                onChangeText={setLoginInput}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <PasswordInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                style={{marginBottom: 0}}
              />
            </View>

            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotButton}>
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.button}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity 
              style={styles.googleButton}
              onPress={handleGoogleLogin}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <ActivityIndicator color={COLORS.text.main} />
              ) : (
                <View style={styles.googleContent}>
                  {/* Google Icon can be added here if available */}
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            style={styles.registerButton}
          >
            <Text style={styles.registerText}>
              Don't have an account?{' '}
              <Text style={styles.registerLink}>Create one</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.serif.bold,
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    fontFamily: FONTS.display.regular,
  },
  card: {
    backgroundColor: COLORS.white,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 8,
    fontFamily: FONTS.display.medium,
  },
  input: {
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    fontSize: 16,
    fontFamily: FONTS.display.regular,
    color: COLORS.text.main,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: -8,
  },
  forgotPassword: {
    color: COLORS.text.secondary,
    fontSize: 14,
    fontFamily: FONTS.display.medium,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.display.bold,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#EEEEEE',
  },
  orText: {
    marginHorizontal: 16,
    color: COLORS.text.muted,
    fontSize: 14,
    fontFamily: FONTS.display.medium,
  },
  googleButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  googleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleButtonText: {
    color: COLORS.text.main,
    fontSize: 16,
    fontFamily: FONTS.display.bold,
  },
  registerButton: {
    alignItems: 'center',
  },
  registerText: {
    fontSize: 15,
    color: COLORS.text.secondary,
    fontFamily: FONTS.display.regular,
  },
  registerLink: {
    color: COLORS.primary,
    fontFamily: FONTS.display.bold,
  },
});
