import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { FONTS } from '../../constants/fonts';
import { useUserStore } from '../../store/userStore';
import { API_CONFIG } from '../../constants';
import axios from 'axios';
import { AddressAutofill } from '../../components/common/AddressAutofill';
import { SavedAddress } from '../../types';
import ArrowLeftIcon from '../../components/icons/ArrowLeftIcon';
import { Feather } from '@expo/vector-icons';

export default function AddressScreen() {
  const navigation = useNavigation();
  const { user, updateUser, addAddress, removeAddress } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialForm = {
    id: '',
    label: 'Home',
    address_1: '',
    city: '',
    state: '',
    postcode: '',
    country: 'IN', // Default to India
    email: user?.email || '',
    phone: '',
    first_name: user?.firstName || '',
    last_name: user?.lastName || '',
    isDefault: false
  };

  const [form, setForm] = useState<SavedAddress>(initialForm as SavedAddress);

  const handleAddNew = () => {
    setForm({ ...initialForm, id: Date.now().toString() } as SavedAddress);
    setEditingId(null);
    setIsFormVisible(true);
  };

  const handleEdit = (address: SavedAddress) => {
    setForm(address);
    setEditingId(address.id);
    setIsFormVisible(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Address', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeAddress(id) }
    ]);
  };

  const handleSave = async () => {
    if (!form.first_name || !form.address_1 || !form.phone) {
        Alert.alert('Error', 'Please fill required fields');
        return;
    }
    
    setLoading(true);
    try {
      // 1. Save locally
      if (editingId) {
          removeAddress(editingId); // Simple update: remove then add
      }
      addAddress({ ...form, id: editingId || Date.now().toString() });

      // 2. If set as default, update WC profile
      if (form.isDefault && user) {
        const updateData = {
            billing: {
              first_name: form.first_name,
              last_name: form.last_name,
              address_1: form.address_1,
              city: form.city,
              state: form.state,
              postcode: form.postcode,
              country: form.country,
              email: form.email,
              phone: form.phone
            },
            shipping: {
              first_name: form.first_name,
              last_name: form.last_name,
              address_1: form.address_1,
              city: form.city,
              state: form.state,
              postcode: form.postcode,
              country: form.country
            }
          };
    
          const response = await axios.put(`${API_CONFIG.BASE_URL}/customers/${user.id}`, updateData, {
            headers: { 'X-API-Key': API_CONFIG.API_KEY }
          });

          if (response.data.success) {
             updateUser({
                billing: response.data.data.billing,
                shipping: response.data.data.shipping
             });
          }
      }

      setIsFormVisible(false);
      Alert.alert('Success', 'Address saved successfully');

    } catch (error: any) {
      console.error('Update error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update address');
    } finally {
      setLoading(false);
    }
  };

  const renderAddressItem = ({ item }: { item: SavedAddress }) => (
      <View style={styles.addressCard}>
          <View style={styles.cardHeader}>
              <View style={styles.labelContainer}>
                <Text style={styles.cardLabel}>{item.label}</Text>
                {item.isDefault && (
                    <View style={styles.defaultBadgeContainer}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                )}
              </View>
              <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
                    <Feather name="edit-2" size={18} color={COLORS.info} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
                    <Feather name="trash-2" size={18} color={COLORS.error} />
                  </TouchableOpacity>
              </View>
          </View>
          
          <View style={styles.cardBody}>
            <Text style={styles.nameText}>{item.first_name} {item.last_name}</Text>
            <Text style={styles.addressText}>{item.address_1}</Text>
            <Text style={styles.addressText}>{item.city}, {item.state} {item.postcode}</Text>
            <Text style={styles.addressText}>{item.country}</Text>
            <View style={styles.phoneRow}>
                <Feather name="phone" size={14} color={COLORS.text.muted} />
                <Text style={styles.phoneText}>{item.phone}</Text>
            </View>
          </View>
      </View>
  );

  if (isFormVisible) {
      return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setIsFormVisible(false)} style={styles.backBtn}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{editingId ? 'Edit Address' : 'New Address'}</Text>
                <View style={{ width: 60 }} />
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Label (e.g. Home, Office)</Text>
                        <TextInput style={styles.input} value={form.label} onChangeText={(text) => setForm({...form, label: text})} placeholder="Home" />
                    </View>

                    <Text style={styles.label}>Full Name</Text>
                    <View style={styles.row}>
                        <TextInput style={[styles.input, styles.halfInput]} value={form.first_name} placeholder="First Name" onChangeText={(text) => setForm({...form, first_name: text})} />
                        <TextInput style={[styles.input, styles.halfInput]} value={form.last_name} placeholder="Last Name" onChangeText={(text) => setForm({...form, last_name: text})} />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Search Address</Text>
                        <AddressAutofill 
                            value={form.address_1}
                            onChangeText={(text) => setForm({...form, address_1: text})}
                            onSelect={(details) => setForm({
                                ...form, 
                                address_1: details.address_1,
                                city: details.city,
                                state: details.state,
                                country: details.country || 'IN'
                            })}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={styles.halfInput}>
                            <Text style={styles.label}>City</Text>
                            <TextInput style={styles.input} value={form.city} onChangeText={(text) => setForm({...form, city: text})} />
                        </View>
                        <View style={styles.halfInput}>
                            <Text style={styles.label}>State</Text>
                            <TextInput style={styles.input} value={form.state} onChangeText={(text) => setForm({...form, state: text})} />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.halfInput}>
                            <Text style={styles.label}>Postcode</Text>
                            <TextInput style={styles.input} value={form.postcode} onChangeText={(text) => setForm({...form, postcode: text})} />
                        </View>
                        <View style={styles.halfInput}>
                            <Text style={styles.label}>Country</Text>
                            <TextInput style={styles.input} value={form.country} editable={false} />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone</Text>
                        <TextInput style={styles.input} value={form.phone} onChangeText={(text) => setForm({...form, phone: text})} keyboardType="phone-pad" />
                    </View>

                    <TouchableOpacity 
                        style={styles.checkboxContainer} 
                        onPress={() => setForm({...form, isDefault: !form.isDefault})}
                    >
                        <View style={[styles.checkbox, form.isDefault && styles.checkboxChecked]}>
                            {form.isDefault && <Feather name="check" size={14} color="#FFF" />}
                        </View>
                        <Text style={styles.checkboxLabel}>Set as default address</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
                        {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveBtnText}>Save Address</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
      );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeftIcon size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Addresses</Text>
        <TouchableOpacity onPress={handleAddNew} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList 
          data={user?.savedAddresses || []}
          keyExtractor={(item) => item.id}
          renderItem={renderAddressItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
              <View style={styles.emptyContainer}>
                  <Feather name="map-pin" size={48} color={COLORS.text.muted} style={{ marginBottom: 16 }} />
                  <Text style={styles.emptyText}>No saved addresses.</Text>
                  <Text style={styles.emptySubText}>Add an address for faster checkout.</Text>
              </View>
          }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  header: { 
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
  },
  backBtn: { width: 60, height: 40, justifyContent: 'center' },
  cancelBtnText: { color: COLORS.text.secondary, fontSize: 16, fontFamily: FONTS.display.medium },
  headerTitle: { fontSize: 18, fontFamily: FONTS.serif.bold, color: COLORS.text.main },
  addBtn: { width: 60, alignItems: 'flex-end', height: 40, justifyContent: 'center' },
  addBtnText: { color: COLORS.primary, fontSize: 16, fontFamily: FONTS.display.bold },
  
  scrollContent: { padding: 20 },
  listContent: { padding: 20 },
  
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
  
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, color: COLORS.text.secondary, marginBottom: 8, fontFamily: FONTS.display.medium },
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
    marginBottom: 16
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
  halfInput: { flex: 1 },
  
  saveBtn: { 
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
  saveBtnText: { color: COLORS.white, fontSize: 16, fontFamily: FONTS.display.bold },

  addressCard: { 
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' },
  labelContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardLabel: { fontSize: 16, fontFamily: FONTS.display.bold, color: COLORS.text.main },
  defaultBadgeContainer: { backgroundColor: COLORS.success + '15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  defaultBadgeText: { color: COLORS.success, fontSize: 10, fontFamily: FONTS.display.bold },
  
  cardActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 4 },
  
  cardBody: { gap: 4 },
  nameText: { fontSize: 16, fontFamily: FONTS.display.medium, color: COLORS.text.main, marginBottom: 2 },
  addressText: { fontSize: 14, color: COLORS.text.secondary, fontFamily: FONTS.display.regular, lineHeight: 20 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  phoneText: { fontSize: 14, color: COLORS.text.muted, fontFamily: FONTS.display.medium },

  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 18, fontFamily: FONTS.display.bold, color: COLORS.text.muted },
  emptySubText: { fontSize: 14, color: COLORS.text.secondary, marginTop: 8, fontFamily: FONTS.display.regular },

  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: COLORS.primary, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: COLORS.primary },
  checkboxLabel: { fontSize: 15, color: COLORS.text.main, fontFamily: FONTS.display.medium },
});