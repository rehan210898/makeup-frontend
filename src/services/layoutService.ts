import apiClient from './api';
import { ApiResponse, HomeLayoutSection } from '../types';

export interface CategoryLayoutItem {
  id: number;
  name: string;
  parent: number;
  image: string | null;
}

export interface SubCategory {
  id: number;
  name: string;
  image: string | null;
}

export interface CategoryTreeItem {
  id: number;
  name: string;
  image: string | null;
  subcategories: SubCategory[];
}

class LayoutService {
  async getHomeLayout(): Promise<HomeLayoutSection[]> {
    const response = await apiClient.get<ApiResponse<HomeLayoutSection[]>>('/layout/home');
    return response.data || response;
  }

  async getCategoryLayout(): Promise<CategoryLayoutItem[]> {
    const response = await apiClient.get<ApiResponse<CategoryLayoutItem[]>>('/layout/categories');
    return response.data || response;
  }

  async getCategoryTree(): Promise<CategoryTreeItem[]> {
    const response = await apiClient.get<ApiResponse<CategoryTreeItem[]>>('/layout/categories-tree');
    return response.data || response;
  }
}

export default new LayoutService();
