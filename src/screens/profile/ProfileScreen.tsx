import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS } from '../../constants';
import { RootStackParamList } from '../../navigation/types';
import { useUserStore } from '../../store/userStore';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, isAuthenticated, logout } = useUserStore();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: () => {
            logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <Text style={styles.headerTitle}>👤 Profile</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        {!isAuthenticated ? (
          <View style={styles.authContainer}>
            <Text style={styles.welcomeText}>Welcome to Fashion Store</Text>
            <Text style={styles.subText}>Sign in to manage your orders</Text>
            
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: COLORS.accent }]}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.outlineButton, { borderColor: COLORS.primary }]}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={[styles.outlineButtonText, { color: COLORS.primary }]}>Create Account</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.profileContainer}>
            <View style={styles.userInfo}>
              <View style={[styles.avatar, { backgroundColor: COLORS.accentLight }]}>
                <Text style={styles.avatarText}>
                  {user?.firstName?.[0]?.toUpperCase() || 'U'}
                </Text>
              </View>
              <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>

            <View style={styles.menu}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => navigation.navigate('EditProfile')}
              >
                <Text style={styles.menuIcon}>👤</Text>
                <Text style={styles.menuText}>Personal Details</Text>
                <Text style={styles.menuArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => navigation.navigate('OrderHistory')}
              >
                <Text style={styles.menuIcon}>📦</Text>
                <Text style={styles.menuText}>My Orders</Text>
                <Text style={styles.menuArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => navigation.navigate('Address')}
              >
                <Text style={styles.menuIcon}>📍</Text>
                <Text style={styles.menuText}>Manage Address</Text>
                <Text style={styles.menuArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => navigation.navigate('Wishlist')}
              >
                <Text style={styles.menuIcon}>❤️</Text>
                <Text style={styles.menuText}>Wishlist</Text>
                <Text style={styles.menuArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => navigation.navigate('ChangePassword')}
              >
                <Text style={styles.menuIcon}>🔒</Text>
                <Text style={styles.menuText}>Change Password</Text>
                <Text style={styles.menuArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.menuItem, styles.logoutButton]}
                onPress={handleLogout}
              >
                <Text style={styles.menuIcon}>🚪</Text>
                <Text style={[styles.menuText, { color: COLORS.error }]}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.cream,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  authContainer: {
    alignItems: 'center',
    width: '100%',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
  },
  subText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  button: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  outlineButton: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
  },
  outlineButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileContainer: {
    width: '100%',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  menu: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  menuText: {
    fontSize: 16,
    flex: 1,
    color: COLORS.primary,
    fontWeight: '500',
  },
  menuArrow: {
    fontSize: 20,
    color: '#ccc',
  },
  logoutButton: {
    borderBottomWidth: 0,
  },
});