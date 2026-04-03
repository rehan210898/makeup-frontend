import apiClient from './api';
import { Category, ApiResponse, Product } from '../types';

class CategoryService {
  async getCategories(page: number = 1, perPage: number = 100): Promise<ApiResponse<Category[]>> {
    return apiClient.get<ApiResponse<Category[]>>(`/categories?page=${page}&per_page=${perPage}`);
  }

  async getMainCategories(perPage: number = 100): Promise<ApiResponse<Category[]>> {
    return apiClient.get<ApiResponse<Category[]>>(`/categories?parent=0&per_page=${perPage}&hide_empty=true`);
  }

  async getSubCategories(parentId: number, perPage: number = 100): Promise<ApiResponse<Category[]>> {
    return apiClient.get<ApiResponse<Category[]>>(`/categories?parent=${parentId}&per_page=${perPage}&hide_empty=true`);
  }

  async getCategoryById(id: number): Promise<ApiResponse<Category>> {
    return apiClient.get<ApiResponse<Category>>(`/categories/${id}`);
  }

  async getCategoryBySlug(slug: string): Promise<ApiResponse<Category[]>> {
    return apiClient.get<ApiResponse<Category[]>>(`/categories?slug=${slug}`);
  }

  async getCategoryProducts(
    categoryId: number,
    page: number = 1,
    perPage: number = 10
  ): Promise<ApiResponse<Product[]>> {
    return apiClient.get<ApiResponse<Product[]>>(
      `/categories/${categoryId}/products?page=${page}&per_page=${perPage}`
    );
  }
}

export default new CategoryService();
