import React, { useState } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../constants';

// Placeholder for Google API Key - Replace with real key in production
const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY';

interface AddressAutofillProps {
    value: string;
    onChangeText: (text: string) => void;
    onSelect: (details: any) => void;
}

export const AddressAutofill = ({ value, onChangeText, onSelect }: AddressAutofillProps) => {
    const [predictions, setPredictions] = useState<any[]>([]);
    const [showPredictions, setShowPredictions] = useState(false);
    
    const searchPlaces = async (text: string) => {
        onChangeText(text);
        if (text.length < 3) {
            setPredictions([]);
            setShowPredictions(false);
            return;
        }

        // MOCK IMPLEMENTATION for demo since we don't have a real API Key
        // In real app, you would fetch from Google Places API:
        // const res = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${text}&key=${GOOGLE_API_KEY}&types=geocode`);
        // const json = await res.json();
        // setPredictions(json.predictions);

        // Mock suggestions for "Ind" (India) or general typing
        const mockData = [
            { description: 'Mumbai, Maharashtra, India', main_text: 'Mumbai', secondary_text: 'Maharashtra, India' },
            { description: 'Delhi, India', main_text: 'Delhi', secondary_text: 'India' },
            { description: 'Bangalore, Karnataka, India', main_text: 'Bangalore', secondary_text: 'Karnataka, India' },
            { description: 'Connaught Place, New Delhi, Delhi, India', main_text: 'Connaught Place', secondary_text: 'New Delhi, Delhi, India' },
        ];

        // Simple mock filter
        const filtered = mockData.filter(d => 
            d.description.toLowerCase().includes(text.toLowerCase())
        );

        setPredictions(filtered);
        setShowPredictions(filtered.length > 0);
    };

    return (
        <View style={styles.container}>
             <TextInput 
                style={styles.input}
                value={value}
                onChangeText={searchPlaces}
                placeholder="Search Address (Google Auto-fill)"
                placeholderTextColor="#999"
             />
             {showPredictions && (
                 <View style={styles.predictionsContainer}>
                     {predictions.map((item, index) => (
                         <TouchableOpacity 
                            key={index} 
                            style={styles.predictionRow}
                            onPress={() => {
                                onChangeText(item.description);
                                setPredictions([]);
                                setShowPredictions(false);
                                onSelect({
                                    address_1: item.main_text,
                                    city: item.secondary_text.split(',')[0].trim(),
                                    state: item.secondary_text.split(',')[1]?.trim() || '',
                                    country: 'IN' 
                                });
                            }}
                         >
                             <Text style={styles.mainText}>{item.main_text}</Text>
                             <Text style={styles.secondaryText}>{item.secondary_text}</Text>
                         </TouchableOpacity>
                     ))}
                 </View>
             )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        zIndex: 100, // Ensure dropdown appears on top
        marginBottom: 15,
    },
    input: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        color: '#333',
    },
    predictionsContainer: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        maxHeight: 200,
    },
    predictionRow: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    mainText: {
        fontWeight: 'bold',
        fontSize: 14,
        color: COLORS.primary,
    },
    secondaryText: {
        fontSize: 12,
        color: '#666',
    }
});
