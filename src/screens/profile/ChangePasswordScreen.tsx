import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { useUserStore } from '../../store/userStore';
import { CustomerService } from '../../services/CustomerService';
import PasswordInput from '../../components/common/PasswordInput';
import { z } from 'zod';

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[0-9]/, 'Must contain a number');

export default function ChangePasswordScreen() {
  const navigation = useNavigation();
  const { user } = useUserStore();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    console.log('Update Password Attempt:', user);

    if (!user || !user.id) {
        Alert.alert('Error', 'User session invalid. Please login again.');
        return;
    }
    
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    const result = passwordSchema.safeParse(password);
    if (!result.success) {
      Alert.alert('Invalid Password', result.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      await CustomerService.updatePassword(user.id, password);
      Alert.alert('Success', 'Password updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.infoText}>
          Create a new strong password for your account.
        </Text>

        <Text style={styles.label}>New Password</Text>
        <PasswordInput
          style={styles.inputContainer}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter new password"
        />

        <Text style={styles.label}>Confirm Password</Text>
        <PasswordInput
          style={styles.inputContainer}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm new password"
        />

        <TouchableOpacity 
          style={styles.button}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Update Password</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
    padding: 20,
  },
  form: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    marginTop: 10,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 10,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
