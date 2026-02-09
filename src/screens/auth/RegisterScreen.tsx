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
import { FONTS } from '../../constants/fonts';
import { RootStackParamList } from '../../navigation/types';
import { AuthService } from '../../services/AuthService';
import PasswordInput from '../../components/common/PasswordInput';
import { z } from 'zod';
import { Feather } from '@expo/vector-icons';
import ArrowLeftIcon from '../../components/icons/ArrowLeftIcon';

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

  const renderStepIndicator = () => (
    <View style={styles.stepContainer}>
        {[1, 2, 3].map((step) => (
            <View key={step} style={styles.stepWrapper}>
                <View style={[styles.stepDot, emailStep >= step && styles.activeStepDot]}>
                    <Text style={[styles.stepNumber, emailStep >= step && styles.activeStepNumber]}>{step}</Text>
                </View>
                {step < 3 && <View style={[styles.stepLine, emailStep > step && styles.activeStepLine]} />}
            </View>
        ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeftIcon size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Account</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {renderStepIndicator()}

          <View style={styles.card}>
             {emailStep === 1 && (
              <View>
                <Text style={styles.cardTitle}>Personal Information</Text>
                
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>First Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter first name"
                        value={formData.firstName}
                        onChangeText={t => setFormData({ ...formData, firstName: t })}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Last Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter last name"
                        value={formData.lastName}
                        onChangeText={t => setFormData({ ...formData, lastName: t })}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <View>
                        <TextInput
                            style={[
                                styles.input, 
                                emailStatus === 'invalid' && styles.inputError, 
                                emailStatus === 'valid' && styles.inputSuccess
                            ]}
                            placeholder="Enter email address"
                            value={formData.email}
                            onChangeText={t => setFormData({ ...formData, email: t.trim() })}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        {emailStatus === 'checking' && <ActivityIndicator style={styles.inputLoader} color={COLORS.primary} />}
                        {emailStatus === 'valid' && <Feather name="check" size={16} color={COLORS.success} style={styles.inputIcon} />}
                    </View>
                    {emailStatus === 'invalid' && <Text style={styles.errorText}>Email already registered</Text>}
                </View>
                
                <TouchableOpacity style={styles.button} onPress={handleNextEmailStep}>
                  <Text style={styles.buttonText}>Next Step</Text>
                </TouchableOpacity>
              </View>
             )}

             {emailStep === 2 && (
              <View>
                <Text style={styles.cardTitle}>Choose Username</Text>
                
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Username</Text>
                    <View>
                        <TextInput
                            style={[
                                styles.input, 
                                usernameStatus === 'taken' && styles.inputError, 
                                usernameStatus === 'valid' && styles.inputSuccess
                            ]}
                            placeholder="Create a unique username"
                            value={formData.username}
                            onChangeText={t => setFormData({ ...formData, username: t.trim().toLowerCase() })}
                            autoCapitalize="none"
                        />
                        {usernameStatus === 'checking' && <ActivityIndicator style={styles.inputLoader} color={COLORS.primary} />}
                        {usernameStatus === 'valid' && <Feather name="check" size={16} color={COLORS.success} style={styles.inputIcon} />}
                    </View>
                    {usernameStatus === 'taken' && <Text style={styles.errorText}>Username is taken</Text>}
                </View>

                {suggestions.length > 0 && (
                    <View style={styles.suggestionsContainer}>
                        <Text style={styles.suggestionTitle}>Suggestions:</Text>
                        <View style={styles.chipContainer}>
                            {loading ? (
                            <ActivityIndicator color={COLORS.primary} />
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
                    </View>
                )}

                <TouchableOpacity style={styles.button} onPress={handleNextEmailStep}>
                  <Text style={styles.buttonText}>Next Step</Text>
                </TouchableOpacity>
              </View>
             )}

             {emailStep === 3 && (
              <View>
                <Text style={styles.cardTitle}>Secure Account</Text>
                
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <PasswordInput
                        style={{ marginBottom: 8 }}
                        placeholder="Create password"
                        value={formData.password}
                        onChangeText={t => setFormData({ ...formData, password: t })}
                    />
                    <Text style={styles.helperText}>Min 8 chars, 1 Uppercase, 1 Number</Text>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <PasswordInput
                        style={{ marginBottom: 8 }}
                        placeholder="Confirm password"
                        value={formData.confirmPassword}
                        onChangeText={t => setFormData({ ...formData, confirmPassword: t })}
                    />
                </View>

                <TouchableOpacity 
                  style={styles.button} 
                  onPress={handleEmailRegister}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Create Account</Text>}
                </TouchableOpacity>
              </View>
             )}
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
              <Text style={styles.loginText}>Already have an account? <Text style={styles.loginLinkBold}>Login</Text></Text>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  stepContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 30,
      paddingHorizontal: 20,
  },
  stepWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  stepDot: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: '#E0E0E0',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
  },
  activeStepDot: {
      backgroundColor: COLORS.primary,
  },
  stepNumber: {
      fontSize: 14,
      fontFamily: FONTS.display.bold,
      color: '#888',
  },
  activeStepNumber: {
      color: '#FFF',
  },
  stepLine: {
      width: 40,
      height: 2,
      backgroundColor: '#E0E0E0',
  },
  activeStepLine: {
      backgroundColor: COLORS.primary,
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
  },
  cardTitle: {
      fontSize: 20,
      fontFamily: FONTS.serif.bold,
      color: COLORS.text.main,
      marginBottom: 20,
      textAlign: 'center',
  },
  
  inputGroup: {
    marginBottom: 16,
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
  inputError: {
    borderColor: COLORS.error,
    borderWidth: 1,
  },
  inputSuccess: {
    borderColor: COLORS.success,
    borderWidth: 1,
  },
  inputLoader: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  inputIcon: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 5,
    fontFamily: FONTS.display.medium,
  },
  helperText: {
    color: COLORS.text.muted,
    fontSize: 12,
    marginTop: 5,
    fontFamily: FONTS.display.regular,
  },
  
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: FONTS.display.bold,
  },
  
  loginLink: {
    marginTop: 30,
    alignItems: 'center',
  },
  loginText: {
      color: COLORS.text.secondary,
      fontSize: 15,
      fontFamily: FONTS.display.medium,
  },
  loginLinkBold: {
    color: COLORS.primary,
    fontFamily: FONTS.display.bold,
  },
  
  suggestionsContainer: {
      marginBottom: 20,
  },
  suggestionTitle: {
    marginBottom: 10,
    fontFamily: FONTS.display.bold,
    color: COLORS.text.main,
    fontSize: 14,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: COLORS.backgroundSubtle,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primaryLight + '40',
  },
  chipText: {
    color: COLORS.primary,
    fontSize: 14,
    fontFamily: FONTS.display.medium,
  },
});