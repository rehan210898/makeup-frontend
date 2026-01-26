import { Product } from '../../types'; // Assuming we can reuse types or define local ones

// Local type definition for the demo to be self-contained
export interface DemoProduct {
  id: number;
  title: string;
  price: number;
  image: string;
  description: string;
}

const TOTAL_PRODUCTS = 100;
const DELAY_MS = 1000;

// Generate mock data
const generateMockProducts = (): DemoProduct[] => {
  return Array.from({ length: TOTAL_PRODUCTS }, (_, index) => ({
    id: index + 1,
    title: `Premium Product ${index + 1}`,
    price: Math.floor(Math.random() * 5000) + 500,
    image: `https://picsum.photos/400/400?random=${index + 1}`,
    description: 'This is a high-quality product description that spans multiple lines to test layout stability.',
  }));
};

const ALL_PRODUCTS = generateMockProducts();

export const fetchProducts = async (page: number, limit: number = 10): Promise<DemoProduct[]> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate network error randomly (5% chance)
      if (Math.random() < 0.05) {
        reject(new Error('Network error: Failed to fetch products'));
        return;
      }

      const start = (page - 1) * limit;
      const end = start + limit;
      
      if (start >= ALL_PRODUCTS.length) {
        resolve([]);
      } else {
        resolve(ALL_PRODUCTS.slice(start, end));
      }
    }, DELAY_MS);
  });
};
