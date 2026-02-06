import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { COLORS, API_CONFIG } from '../../constants';
import { RootStackParamList } from '../../navigation/types';
import { AuthService } from '../../services/AuthService';
import { useUserStore } from '../../store/userStore';
import { User } from '../../types';
import { GlassCard, GlassButton, GlassInput } from '../../components/ui';
import { FloatingIconsBackground } from '../../components/home/FloatingIconsBackground';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID_WEB = '';
const GOOGLE_CLIENT_ID_IOS = '';
const GOOGLE_CLIENT_ID_ANDROID = '';

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    // Prefer server-side OAuth flow (works in all environments including dev-client builds)
    // The expo-auth-session flow requires valid client IDs per platform
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
      <FloatingIconsBackground />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={FadeInDown.duration(600).delay(100)}
            style={styles.headerContainer}
          >
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue shopping</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(600).delay(200)}>
            <GlassCard variant="gradient" padding={24} style={styles.formCard}>
              <GlassInput
                label="Email or Username"
                placeholder="Enter your email or username"
                value={loginInput}
                onChangeText={setLoginInput}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                variant="filled"
              />

              <GlassInput
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                variant="filled"
                rightIcon={
                  <Text style={styles.showHide}>{showPassword ? 'Hide' : 'Show'}</Text>
                }
                onRightIconPress={() => setShowPassword(!showPassword)}
              />

              <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotButton}>
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
              </TouchableOpacity>

              <GlassButton
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                variant="primary"
                size="large"
                fullWidth
                style={styles.loginButton}
              />

              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.line} />
              </View>

              <GlassButton
                title="Continue with Google"
                onPress={handleGoogleLogin}
                loading={googleLoading}
                disabled={googleLoading}
                variant="outline"
                size="large"
                fullWidth
              />
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(600).delay(400)}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              style={styles.registerButton}
            >
              <Text style={styles.registerText}>
                Don't have an account?{' '}
                <Text style={styles.registerLink}>Create one</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
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
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray[500],
  },
  formCard: {
    marginBottom: 24,
  },
  showHide: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -8,
  },
  forgotPassword: {
    color: COLORS.gray[600],
    fontSize: 14,
  },
  loginButton: {
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gray[300],
  },
  orText: {
    marginHorizontal: 16,
    color: COLORS.gray[500],
    fontSize: 14,
    fontWeight: '500',
  },
  registerButton: {
    alignItems: 'center',
  },
  registerText: {
    fontSize: 15,
    color: COLORS.gray[600],
  },
  registerLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
