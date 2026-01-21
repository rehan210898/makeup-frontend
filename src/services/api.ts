import axios, { AxiosInstance } from 'axios';
import { API_CONFIG } from '../constants';
import { useUserStore } from '../store/userStore';

class ApiClient {
  private client: AxiosInstance;

  private nonce: string | null = null;
  private cookieMap: Map<string, string> = new Map();

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        if (API_CONFIG.API_KEY) {
          config.headers['X-API-Key'] = API_CONFIG.API_KEY;
        }
        
        // Add Bearer Token from Store
        const token = useUserStore.getState().token;
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }

        if (this.nonce) {
            config.headers['X-WC-Store-API-Nonce'] = this.nonce;
        }
        if (this.cookieMap.size > 0) {
            config.headers['Cookie'] = Array.from(this.cookieMap.values()).join('; ');
        }
        console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('📤 Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        // Log simplified response (status only) to avoid clutter
        // console.log(`📥 API Response: ${response.status}`);
        
        const nonce = 
            response.headers['x-wc-store-api-nonce'] || 
            response.headers['nonce'] || 
            response.headers['X-WC-Store-API-Nonce']; // handle case variance

        if (nonce) {
            this.nonce = nonce;
            console.log('🔑 Updated Nonce:', this.nonce);
        }
        
        const setCookie = response.headers['set-cookie'];
        if (setCookie) {
            const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
            cookies.forEach(c => {
                // Simple parse: take everything before the first '=' as name
                const name = c.split('=')[0].trim();
                this.cookieMap.set(name, c);
            });
        }
        return response;
      },
      (error) => {
        console.error('📥 Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data;
  }
}

export default new ApiClient();