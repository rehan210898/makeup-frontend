import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { FONTS } from '../../constants/fonts';
import { RootStackParamList } from '../../navigation/types';
import { useUserStore } from '../../store/userStore';
import { GlassView } from '../../components/common/GlassView';
import ArrowLeftIcon from '../../components/icons/ArrowLeftIcon';

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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeftIcon size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!isAuthenticated ? (
          <View style={styles.authContainer}>
            <Text style={styles.welcomeText}>Welcome to Fashion Store</Text>
            <Text style={styles.subText}>Sign in to manage your orders</Text>
            
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: COLORS.primary }]}
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
              <View style={[styles.avatar, { backgroundColor: COLORS.accent }]}>
                <Text style={styles.avatarText}>
                  {user?.firstName?.[0]?.toUpperCase() || 'U'}
                </Text>
              </View>
              <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>

            <GlassView style={styles.menuContainer}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => navigation.navigate('EditProfile')}
              >
                <View style={styles.iconBox}>
                    <Feather name="user" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.menuText}>Personal Details</Text>
                <Feather name="chevron-right" size={20} color={COLORS.text.muted} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => navigation.navigate('OrderHistory')}
              >
                <View style={styles.iconBox}>
                    <Feather name="package" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.menuText}>My Orders</Text>
                <Feather name="chevron-right" size={20} color={COLORS.text.muted} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => navigation.navigate('Address')}
              >
                <View style={styles.iconBox}>
                    <Feather name="map-pin" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.menuText}>Manage Address</Text>
                <Feather name="chevron-right" size={20} color={COLORS.text.muted} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => navigation.navigate('Wishlist')}
              >
                <View style={styles.iconBox}>
                    <Feather name="heart" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.menuText}>Wishlist</Text>
                <Feather name="chevron-right" size={20} color={COLORS.text.muted} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => navigation.navigate('ChangePassword')}
              >
                <View style={styles.iconBox}>
                    <Feather name="lock" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.menuText}>Change Password</Text>
                <Feather name="chevron-right" size={20} color={COLORS.text.muted} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.menuItem, styles.logoutButton]}
                onPress={handleLogout}
              >
                <View style={styles.iconBox}>
                    <Feather name="log-out" size={20} color={COLORS.error} />
                </View>
                <Text style={[styles.menuText, { color: COLORS.error }]}>Logout</Text>
              </TouchableOpacity>
            </GlassView>
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
    flexGrow: 1,
    padding: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  authContainer: {
    alignItems: 'center',
    width: '100%',
    marginTop: 50,
  },
  welcomeText: {
    fontSize: 24,
    fontFamily: FONTS.serif.bold,
    color: COLORS.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  subText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: 40,
    fontFamily: FONTS.display.regular,
  },
  button: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: FONTS.display.bold,
  },
  outlineButton: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  outlineButtonText: {
    fontSize: 16,
    fontFamily: FONTS.display.bold,
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
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarText: {
    fontSize: 40,
    fontFamily: FONTS.serif.bold,
    color: COLORS.primary,
  },
  userName: {
    fontSize: 24,
    fontFamily: FONTS.serif.bold,
    color: COLORS.primary,
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: COLORS.text.secondary,
    fontFamily: FONTS.display.medium,
  },
  menuContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,1)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: {
    fontSize: 16,
    flex: 1,
    color: COLORS.text.main,
    fontFamily: FONTS.display.medium,
  },
  logoutButton: {
    borderBottomWidth: 0,
    marginTop: 10,
  },
});