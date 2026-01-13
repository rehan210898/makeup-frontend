import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '../../constants';
import { RootStackParamList } from '../../navigation/types';
import { AuthService } from '../../services/AuthService';
import { z } from 'zod';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Validation Schemas
const step1Schema = z.object({
  firstName: z.string().min(2, 'First name too short'),
  lastName: z.string().min(2, 'Last name too short'),
  email: z.string().email('Invalid email address')
});

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[0-9]/, 'Must contain a number');

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  
  // --- EMAIL FLOW STATE ---
  const [emailStep, setEmailStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'valid' | 'taken'>('idle');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // --- EMAIL EFFECTS ---
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.email && emailStep === 1 && z.string().email().safeParse(formData.email).success) {
        checkEmailAvailability(formData.email);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.email]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.username && emailStep === 2 && formData.username.length >= 4) {
        checkUsernameAvailability(formData.username);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.username]);

  // --- EMAIL ACTIONS ---
  const checkEmailAvailability = async (email: string) => {
    setEmailStatus('checking');
    try {
      const res = await AuthService.checkEmail(email);
      setEmailStatus(res.available ? 'valid' : 'invalid');
    } catch (e) {
      setEmailStatus('idle'); 
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    setUsernameStatus('checking');
    try {
      const res = await AuthService.checkUsername(username);
      setUsernameStatus(res.available ? 'valid' : 'taken');
    } catch (e) {
      setUsernameStatus('idle');
    }
  };

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await AuthService.generateUsername(formData.firstName, formData.lastName, formData.email);
      setSuggestions(res.suggestions);
    } catch (error) {
      console.log('Failed to fetch suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleNextEmailStep = async () => {
    if (emailStep === 1) {
      const result = step1Schema.safeParse({ 
        firstName: formData.firstName, 
        lastName: formData.lastName, 
        email: formData.email 
      });

      if (!result.success) {
        Alert.alert('Error', result.error.issues[0].message);
        return;
      }

      if (emailStatus === 'invalid') {
        Alert.alert('Error', 'Email is already registered');
        return;
      }

      setEmailStep(2);
      fetchSuggestions();
    } else if (emailStep === 2) {
        if (!formData.username || formData.username.length < 4) {
            Alert.alert('Error', 'Username must be at least 4 characters');
            return;
        }
        if (usernameStatus === 'taken') {
            Alert.alert('Error', 'Username is taken');
            return;
        }
        setEmailStep(3);
    }
  };

  const handleEmailRegister = async () => {
    const result = passwordSchema.safeParse(formData.password);
    if (!result.success) {
      Alert.alert('Invalid Password', result.error.issues[0].message);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await AuthService.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username
      });

      navigation.navigate('VerifyEmail', { 
        email: formData.email,
        password: formData.password 
      });
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Create Account</Text>
        
        <View>
           {emailStep === 1 && (
            <View>
              <Text style={styles.subtitle}>Personal Information</Text>
              <TextInput
                style={styles.input}
                placeholder="First Name"
                value={formData.firstName}
                onChangeText={t => setFormData({ ...formData, firstName: t })}
              />
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                value={formData.lastName}
                onChangeText={t => setFormData({ ...formData, lastName: t })}
              />
              <View>
                <TextInput
                    style={[styles.input, emailStatus === 'invalid' && styles.inputError, emailStatus === 'valid' && styles.inputSuccess]}
                    placeholder="Email Address"
                    value={formData.email}
                    onChangeText={t => setFormData({ ...formData, email: t.trim() })}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                {emailStatus === 'checking' && <ActivityIndicator style={styles.inputLoader} />}
              </View>
              {emailStatus === 'invalid' && <Text style={styles.errorText}>Email already registered</Text>}
              
              <TouchableOpacity style={styles.button} onPress={handleNextEmailStep}>
                <Text style={styles.buttonText}>Next</Text>
              </TouchableOpacity>
            </View>
           )}

           {emailStep === 2 && (
            <View>
              <Text style={styles.subtitle}>Choose a Username</Text>
              <View>
                <TextInput
                    style={[styles.input, usernameStatus === 'taken' && styles.inputError, usernameStatus === 'valid' && styles.inputSuccess]}
                    placeholder="Username"
                    value={formData.username}
                    onChangeText={t => setFormData({ ...formData, username: t.trim().toLowerCase() })}
                    autoCapitalize="none"
                />
                {usernameStatus === 'checking' && <ActivityIndicator style={styles.inputLoader} />}
              </View>
              {usernameStatus === 'taken' && <Text style={styles.errorText}>Username is taken</Text>}

              <Text style={styles.suggestionTitle}>Suggestions:</Text>
              <View style={styles.chipContainer}>
                {loading ? (
                   <ActivityIndicator />
                ) : (
                    suggestions.map(s => (
                        <TouchableOpacity 
                            key={s} 
                            style={styles.chip} 
                            onPress={() => setFormData({ ...formData, username: s })}
                        >
                            <Text style={styles.chipText}>{s}</Text>
                        </TouchableOpacity>
                    ))
                )}
              </View>

              <TouchableOpacity style={styles.button} onPress={handleNextEmailStep}>
                <Text style={styles.buttonText}>Next</Text>
              </TouchableOpacity>
            </View>
           )}

           {emailStep === 3 && (
            <View>
              <Text style={styles.subtitle}>Secure your account</Text>
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={formData.password}
                onChangeText={t => setFormData({ ...formData, password: t })}
                secureTextEntry
              />
              <Text style={styles.helperText}>Min 8 chars, 1 Uppercase, 1 Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChangeText={t => setFormData({ ...formData, confirmPassword: t })}
                secureTextEntry
              />
              <TouchableOpacity 
                style={styles.button} 
                onPress={handleEmailRegister}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color={COLORS.cream} /> : <Text style={styles.buttonText}>Create Account</Text>}
              </TouchableOpacity>
            </View>
           )}
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
            <Text style={styles.linkText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#444'
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputError: {
    borderColor: 'red',
    borderWidth: 1,
  },
  inputSuccess: {
    borderColor: 'green',
    borderWidth: 1,
  },
  inputLoader: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
  },
  helperText: {
    color: '#666',
    fontSize: 12,
    marginBottom: 15,
    marginLeft: 5,
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
  backLink: {
    marginTop: 30,
    alignItems: 'center',
  },
  linkButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  linkText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  suggestionTitle: {
    marginBottom: 10,
    fontWeight: 'bold',
    color: '#444'
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    color: '#333',
    fontSize: 14,
  },
});
