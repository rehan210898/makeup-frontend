import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS } from '../../constants';
import { FONTS } from '../../constants/fonts';
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
  const variationAttributes = attributes.filter(attr => attr.variation);

  if (!variationAttributes || variationAttributes.length === 0) {
    return null;
  }

  const isOptionAvailable = (attributeName: string, option: string): boolean => {
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
      {variationAttributes.map((attribute) => (
        <View key={attribute.id} style={styles.attributeBlock}>
          <Text style={styles.attributeLabel}>
            {attribute.name}
            {selectedAttributes[attribute.name] && (
              <Text style={styles.selectedValue}> : {selectedAttributes[attribute.name]}</Text>
            )}
          </Text>

          <View style={styles.optionsWrap}>
            {attribute.options.map((option) => {
              const isSelected = selectedAttributes[attribute.name] === option;
              const isAvailable = isOptionAvailable(attribute.name, option);

              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.chip,
                    isSelected && styles.chipSelected,
                    !isAvailable && styles.chipDisabled,
                  ]}
                  onPress={() => isAvailable && onAttributeSelect(attribute.name, option)}
                  disabled={!isAvailable}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextSelected,
                      !isAvailable && styles.chipTextDisabled,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  attributeBlock: {
    gap: 10,
  },
  attributeLabel: {
    fontSize: 13,
    fontFamily: FONTS.display.semiBold,
    color: COLORS.text.main,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedValue: {
    fontFamily: FONTS.display.medium,
    color: COLORS.primary,
    textTransform: 'none',
    letterSpacing: 0,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    backgroundColor: COLORS.white,
  },
  chipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  chipDisabled: {
    opacity: 0.35,
    backgroundColor: '#F5F5F5',
  },
  chipText: {
    fontSize: 13,
    fontFamily: FONTS.display.medium,
    color: COLORS.text.main,
  },
  chipTextSelected: {
    color: COLORS.white,
    fontFamily: FONTS.display.bold,
  },
  chipTextDisabled: {
    color: COLORS.text.muted,
    textDecorationLine: 'line-through',
  },
});
