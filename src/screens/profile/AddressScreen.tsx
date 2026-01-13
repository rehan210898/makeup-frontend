import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants';
import { useUserStore } from '../../store/userStore';
import { API_CONFIG } from '../../constants';
import axios from 'axios';
import { AddressAutofill } from '../../components/common/AddressAutofill';
import { SavedAddress } from '../../types';

export default function AddressScreen() {
  const navigation = useNavigation();
  const { user, token, updateUser, addAddress, removeAddress } = useUserStore();
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
              <Text style={styles.cardLabel}>{item.label} {item.isDefault && <Text style={styles.defaultBadge}>(Default)</Text>}</Text>
              <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => handleEdit(item)}><Text style={styles.editText}>Edit</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)}><Text style={styles.deleteText}>Delete</Text></TouchableOpacity>
              </View>
          </View>
          <Text style={styles.cardText}>{item.first_name} {item.last_name}</Text>
          <Text style={styles.cardText}>{item.address_1}</Text>
          <Text style={styles.cardText}>{item.city}, {item.state} {item.postcode}</Text>
          <Text style={styles.cardText}>{item.country}</Text>
          <Text style={styles.cardText}>{item.phone}</Text>
      </View>
  );

  if (isFormVisible) {
      return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
            <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
                <TouchableOpacity onPress={() => setIsFormVisible(false)} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{editingId ? 'Edit Address' : 'New Address'}</Text>
                <View style={{ width: 60 }} />
            </View>
            <ScrollView style={styles.content}>
                <View style={styles.formSection}>
                    <Text style={styles.label}>Label (e.g. Home, Office)</Text>
                    <TextInput style={styles.input} value={form.label} onChangeText={(text) => setForm({...form, label: text})} />

                    <Text style={styles.label}>Full Name</Text>
                    <View style={styles.row}>
                        <TextInput style={[styles.input, styles.halfInput]} value={form.first_name} placeholder="First Name" onChangeText={(text) => setForm({...form, first_name: text})} />
                        <TextInput style={[styles.input, styles.halfInput]} value={form.last_name} placeholder="Last Name" onChangeText={(text) => setForm({...form, last_name: text})} />
                    </View>

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

                    <Text style={styles.label}>Phone</Text>
                    <TextInput style={styles.input} value={form.phone} onChangeText={(text) => setForm({...form, phone: text})} keyboardType="phone-pad" />

                    <TouchableOpacity 
                        style={styles.checkboxContainer} 
                        onPress={() => setForm({...form, isDefault: !form.isDefault})}
                    >
                        <View style={[styles.checkbox, form.isDefault && styles.checkboxChecked]} />
                        <Text style={styles.checkboxLabel}>Set as default address</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
            <View style={styles.footer}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
                    {loading ? <ActivityIndicator color={COLORS.cream} /> : <Text style={styles.saveBtnText}>Save Address</Text>}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
      );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
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
          ListEmptyComponent={
              <View style={styles.emptyContainer}>
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
  header: { paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { width: 60 },
  backBtnText: { color: COLORS.cream, fontSize: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.cream },
  addBtn: { width: 60, alignItems: 'flex-end' },
  addBtnText: { color: COLORS.cream, fontSize: 16, fontWeight: 'bold' },
  content: { flex: 1, padding: 20 },
  listContent: { padding: 20 },
  formSection: { backgroundColor: COLORS.white, padding: 20, borderRadius: 12, marginBottom: 20 },
  label: { fontSize: 14, color: '#666', marginBottom: 5, fontWeight: '500' },
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 15, color: '#333' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
  halfInput: { flex: 1 },
  footer: { padding: 20, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: '#eee' },
  saveBtn: { padding: 16, borderRadius: 10, alignItems: 'center', backgroundColor: COLORS.primary },
  saveBtnText: { color: COLORS.cream, fontSize: 16, fontWeight: 'bold' },
  addressCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardLabel: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  cardActions: { flexDirection: 'row', gap: 15 },
  editText: { color: COLORS.info, fontWeight: '600' },
  deleteText: { color: COLORS.error, fontWeight: '600' },
  cardText: { fontSize: 14, color: '#555', marginBottom: 2 },
  defaultBadge: { color: COLORS.success, fontSize: 12, fontWeight: 'normal' },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: COLORS.gray[500] },
  emptySubText: { fontSize: 14, color: COLORS.gray[400], marginTop: 5 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: COLORS.primary, marginRight: 10 },
  checkboxChecked: { backgroundColor: COLORS.primary },
  checkboxLabel: { fontSize: 14, color: '#333' },
});