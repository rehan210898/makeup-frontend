import ApiClient from './api';

export interface Brand {
  id: number;
  name: string;
  slug: string;
  description?: string;
  count: number;
  image?: string; // Custom extension if supported, otherwise placeholder
}

const BRAND_ATTRIBUTE_ID = 1; // Verified from backend

class BrandService {
  async getBrands(ids?: number[]): Promise<Brand[]> {
    try {
      // Fetch all terms for the Brand attribute
      // In a real app with many brands, we should cache this or use 'include' param if supported by WC/BFF
      const response = await ApiClient.get<any>(`/attributes/${BRAND_ATTRIBUTE_ID}/terms`, {
        params: { per_page: 100, hide_empty: true }
      });
      
      let brands: Brand[] = response.data || [];

      if (ids && ids.length > 0) {
        brands = brands.filter(b => ids.includes(b.id));
        
        // Sort by input order
        brands.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
      }

      return brands;
    } catch (error) {
      console.error('Error fetching brands:', error);
      return [];
    }
  }
}

export default new BrandService();
