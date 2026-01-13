import apiClient from './api';
import { Product, ApiResponse, ProductFilters, ProductVariation, AttributeTaxonomy, AttributeTerm, Tag } from '../types';

class ProductService {
  async getProducts(filters?: ProductFilters): Promise<ApiResponse<Product[]>> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(val => params.append(key, String(val)));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    const url = `/products${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get<ApiResponse<Product[]>>(url);
  }

  async getProductById(id: number): Promise<ApiResponse<Product>> {
    return apiClient.get<ApiResponse<Product>>(`/products/${id}`);
  }

  async getProductBySlug(slug: string): Promise<ApiResponse<Product>> {
    return apiClient.get<ApiResponse<Product>>(`/products/slug/${slug}`);
  }

  async getAttributes(): Promise<ApiResponse<AttributeTaxonomy[]>> {
    return apiClient.get<ApiResponse<AttributeTaxonomy[]>>('/attributes');
  }

  async getAttributeTerms(attributeId: number): Promise<ApiResponse<AttributeTerm[]>> {
    return apiClient.get<ApiResponse<AttributeTerm[]>>(`/attributes/${attributeId}/terms`);
  }

  async getTags(): Promise<ApiResponse<Tag[]>> {
    return apiClient.get<ApiResponse<Tag[]>>('/tags');
  }

  // ✅ NEW: Get product variations
  async getProductVariations(productId: number): Promise<ApiResponse<ProductVariation[]>> {
    return apiClient.get<ApiResponse<ProductVariation[]>>(`/products/${productId}/variations`);
  }

  async getFeaturedProducts(perPage: number = 10): Promise<ApiResponse<Product[]>> {
    return apiClient.get<ApiResponse<Product[]>>(`/products/featured/list?per_page=${perPage}`);
  }

  async getOnSaleProducts(page: number = 1, perPage: number = 10): Promise<ApiResponse<Product[]>> {
    return apiClient.get<ApiResponse<Product[]>>(`/products/on-sale/list?page=${page}&per_page=${perPage}`);
  }

  async getRelatedProducts(productId: number, perPage: number = 4): Promise<ApiResponse<Product[]>> {
    return apiClient.get<ApiResponse<Product[]>>(`/products/related/${productId}?per_page=${perPage}`);
  }

  async getProductReviews(productId: number, page: number = 1, perPage: number = 10): Promise<ApiResponse<any[]>> {
    return apiClient.get<ApiResponse<any[]>>(`/products/${productId}/reviews?page=${page}&per_page=${perPage}`);
  }

  async searchProducts(query: string, page: number = 1, perPage: number = 10): Promise<ApiResponse<Product[]>> {
    return apiClient.get<ApiResponse<Product[]>>(`/products?search=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`);
  }
}

export default new ProductService();