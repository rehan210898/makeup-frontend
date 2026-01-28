import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { COLORS } from '../../constants';
import { RootStackParamList } from '../../navigation/types';
import { AuthService } from '../../services/AuthService';
import { CustomerService } from '../../services/CustomerService';
import { useUserStore } from '../../store/userStore';
import { User } from '../../types';
import PasswordInput from '../../components/common/PasswordInput';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser, isAuthenticated } = useUserStore();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    }
  }, [isAuthenticated, navigation]);

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

  const handleGoogleLogin = async () => {
    try {
      // Create redirect URL based on environment (Expo Go vs Standalone)
      const redirectUrl = Linking.createURL('/'); 
      const scheme = redirectUrl.split(':')[0]; // Extract scheme
      
      // Append redirect_scheme to backend URL so it knows where to redirect back
      const authUrl = `${AuthService.getGoogleAuthUrl()}?redirect_scheme=${scheme}`;

      // Open browser
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUrl
      );

      if (result.type === 'success' && result.url) {
        // Parse token and user info from URL
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
                billing: undefined, // Will be loaded later if needed
                shipping: undefined 
             };

             setUser(user, token);
             Alert.alert('Success', `Welcome back, ${user.firstName}!`);
             // Navigation reset is handled by the useEffect listener on isAuthenticated
        } else {
           Alert.alert('Error', 'Invalid response from Google Login.');
        }
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Google Sign In failed');
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
      <Text style={styles.title}>Welcome Back</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email or Username"
        value={loginInput}
        onChangeText={setLoginInput}
        autoCapitalize="none"
      />
      
      <PasswordInput
        style={{ marginBottom: 15 }}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity onPress={handleForgotPassword}>
        <Text style={styles.forgotPassword}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.cream} />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.line} />
      </View>

      <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
        <Text style={styles.googleButtonText}>Sign in with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.linkText}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: COLORS.cream,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 40,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: COLORS.cream,
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    color: '#666',
    marginBottom: 20,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccc',
  },
  orText: {
    marginHorizontal: 10,
    color: '#666',
  },
  googleButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  googleButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  linkText: {
    marginTop: 20,
    color: COLORS.primary,
    textAlign: 'center',
    fontSize: 14,
  },
});
