import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { ShippingRate } from '../types';

interface ShippingSelectorProps {
  rates: ShippingRate[];
  selectedRateId?: string;
  onSelectRate: (rateId: string) => void;
  isLoading?: boolean;
  currencySymbol?: string;
}

const formatPrice = (price: string, currencySymbol: string = '$') => {
  // WooCommerce Store API returns price in minor units (e.g. cents) as a string
  const numericPrice = parseInt(price, 10);
  if (isNaN(numericPrice)) return price;
  
  return `${currencySymbol}${(numericPrice / 100).toFixed(2)}`;
};

export const ShippingSelector: React.FC<ShippingSelectorProps> = ({
  rates,
  selectedRateId,
  onSelectRate,
  isLoading = false,
  currencySymbol = '$',
}) => {
  if (rates.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shipping Method</Text>
      
      {rates.map((rate) => {
        const isSelected = rate.selected || rate.rate_id === selectedRateId;
        
        return (
          <TouchableOpacity
            key={rate.rate_id}
            style={[
              styles.optionCard,
              isSelected && styles.selectedOptionCard,
            ]}
            onPress={() => onSelectRate(rate.rate_id)}
            disabled={isLoading}
          >
            <View style={styles.radioContainer}>
              <View style={[
                styles.radioButton,
                isSelected && styles.radioButtonSelected
              ]} />
            </View>
            
            <View style={styles.contentContainer}>
              <View style={styles.headerRow}>
                <Text style={[styles.methodName, isSelected && styles.selectedText]}>
                  {rate.name}
                </Text>
                <Text style={[styles.price, isSelected && styles.selectedText]}>
                  {formatPrice(rate.price, currencySymbol)}
                </Text>
              </View>
              
              {rate.description ? (
                <Text style={styles.description}>{rate.description}</Text>
              ) : null}
              
              {rate.delivery_time ? (
                 <Text style={styles.deliveryTime}>{rate.delivery_time}</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        );
      })}
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#000" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1a1a1a',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  selectedOptionCard: {
    borderColor: '#007AFF', // Primary color
    backgroundColor: '#f8fbff',
  },
  radioContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d1d1',
    backgroundColor: 'transparent',
  },
  radioButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectedText: {
    color: '#007AFF',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  deliveryTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
