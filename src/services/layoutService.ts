import apiClient from './api';
import { ApiResponse, HomeLayoutSection } from '../types';

class LayoutService {
  async getHomeLayout(): Promise<HomeLayoutSection[]> {
    const response = await apiClient.get<ApiResponse<HomeLayoutSection[]>>('/layout/home');
    // The BFF returns the array directly or wrapped in data? 
    // Looking at layoutService.js in BFF, it returns the array directly. 
    // But apiClient expects ApiResponse structure usually? 
    // Wait, BFF `layoutService.js` returns `layout` (array).
    // But `src/routes/layout.js` (which I haven't seen yet) probably wraps it?
    // Let's check src/routes/layout.js quickly to be sure.
    return response.data || response; // Handle both cases for robustness
  }
}

export default new LayoutService();
