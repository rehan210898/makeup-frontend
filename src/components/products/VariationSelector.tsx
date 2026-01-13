import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS } from '../../constants';
import { Attribute, ProductVariation } from '../../types';

interface VariationSelectorProps {
  attributes: Attribute[];
  variations: ProductVariation[];
  selectedAttributes: { [key: string]: string };
  onAttributeSelect: (attributeName: string, option: string) => void;
}

export default function VariationSelector({
  attributes,
  variations,
  selectedAttributes,
  onAttributeSelect,
}: VariationSelectorProps) {
  if (!attributes || attributes.length === 0) {
    return null;
  }

  const isOptionAvailable = (attributeName: string, option: string): boolean => {
    // Check if this option combination is available in variations
    const testSelection = { ...selectedAttributes, [attributeName]: option };
    
    return variations.some(variation => {
      return variation.attributes.every(attr => {
        const selectedValue = testSelection[attr.name];
        return !selectedValue || attr.option === selectedValue;
      });
    });
  };

  return (
    <View style={styles.container}>
      {attributes.map((attribute) => (
        <View key={attribute.id} style={styles.attributeContainer}>
          <Text style={styles.attributeLabel}>{attribute.name}:</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.optionsScroll}
          >
            {attribute.options.map((option) => {
              const isSelected = selectedAttributes[attribute.name] === option;
              const isAvailable = isOptionAvailable(attribute.name, option);
              
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    isSelected && styles.optionButtonSelected,
                    !isAvailable && styles.optionButtonDisabled,
                    { 
                      backgroundColor: isSelected 
                        ? COLORS.accent 
                        : isAvailable 
                        ? COLORS.white 
                        : COLORS.gray[200] 
                    },
                  ]}
                  onPress={() => isAvailable && onAttributeSelect(attribute.name, option)}
                  disabled={!isAvailable}
                >
                  <Text 
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                      !isAvailable && styles.optionTextDisabled,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ))}
      
      {Object.keys(selectedAttributes).length > 0 && (
        <View style={[styles.selectionSummary, { backgroundColor: COLORS.accentLight }]}>
          <Text style={styles.selectionText}>
            Selected: {Object.entries(selectedAttributes).map(([key, value]) => `${key}: ${value}`).join(', ')}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
  },
  attributeContainer: {
    marginBottom: 20,
  },
  attributeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 10,
  },
  optionsScroll: {
    flexDirection: 'row',
  },
  optionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    minWidth: 80,
    alignItems: 'center',
  },
  optionButtonSelected: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  optionButtonDisabled: {
    opacity: 0.5,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },
  optionTextSelected: {
    fontWeight: 'bold',
  },
  optionTextDisabled: {
    color: COLORS.gray[400],
    textDecorationLine: 'line-through',
  },
  selectionSummary: {
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  selectionText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
});