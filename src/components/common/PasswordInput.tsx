import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';
import EyeIcon from '../icons/EyeIcon';
import EyeOffIcon from '../icons/EyeOffIcon';

interface PasswordInputProps extends TextInputProps {
  style?: any;
}

export default function PasswordInput({ style, ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <View style={[styles.container, style]}>
      <TextInput
        style={styles.input}
        secureTextEntry={!isVisible}
        {...props}
      />
      <TouchableOpacity 
        style={styles.iconContainer} 
        onPress={() => setIsVisible(!isVisible)}
      >
        {isVisible ? (
          <EyeOffIcon size={20} color="#666" />
        ) : (
          <EyeIcon size={20} color="#666" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  input: {
    flex: 1,
    padding: 15,
    height: '100%',
  },
  iconContainer: {
    padding: 10,
  },
});
