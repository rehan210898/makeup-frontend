import { useEffect, useRef } from 'react';
import { AddressSchema } from '../services/CartService';

interface AutoUpdateProps {
    form: any;
    updateAddress: (payload: any) => void;
}

/**
 * Hook to automatically trigger address updates when the form changes.
 * Includes debouncing and specific validation logic for India vs International.
 */
export const useAddressAutoUpdate = ({ form, updateAddress }: AutoUpdateProps) => {
    const isFirstRun = useRef(true);

    useEffect(() => {
        const cleanPostcode = form.postcode.trim();
        const cleanCity = form.city.trim();
        
        let isValidForUpdate = false;

        if (form.country === 'IN') {
            // Strict rules for India: 6 digits, numeric only
            // Prevents "rest_invalid_param" errors from partially typed postcodes
            const numericOnly = cleanPostcode.replace(/[^0-9]/g, '');
            const hasInvalidChars = /[^0-9\s]/.test(cleanPostcode);
            isValidForUpdate = !hasInvalidChars && numericOnly.length === 6 && !!cleanCity;
        } else {
            // Looser rules for International
            isValidForUpdate = cleanPostcode.length >= 3 && !!cleanCity && !!form.country;
        }

        if (isValidForUpdate) {
            // Immediate update on first load (if pre-filled), else debounce
            const delay = isFirstRun.current ? 0 : 1000;
            isFirstRun.current = false;

            console.log('📝 Address Form Changed - Scheduling Update', { 
                city: cleanCity, 
                postcode: cleanPostcode, 
                country: form.country, 
                delay 
            });
            
            const timeout = setTimeout(() => {
                const payload = {
                    first_name: form.firstName,
                    last_name: form.lastName,
                    address_1: form.address,
                    city: cleanCity,
                    state: form.state,
                    postcode: cleanPostcode,
                    country: form.country,
                    email: form.email,
                    phone: form.phone
                };
                
                // Validate with Zod before sending (Silent validation for auto-update)
                const result = AddressSchema.safeParse(payload);
                if (result.success) {
                    console.log('🚀 Triggering Address Update. Payload:', JSON.stringify(payload));
                    updateAddress(payload);
                } else {
                    console.log('⚠️ Address Invalid for Auto-Update:', result.error.issues[0].message);
                }
            }, delay);
            
            return () => clearTimeout(timeout);
        }
    }, [
        form.country, 
        form.city, 
        form.state, 
        form.postcode, 
        form.address, 
        form.firstName, 
        form.lastName, 
        form.email, 
        form.phone
    ]);
};
