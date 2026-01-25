// Product Types
export interface Product {
  id: number;
  name: string;
  slug: string;
  type: string;
  status: string;
  featured: boolean;
  description: string;
  shortDescription: string;
  sku: string;
  price: string;
  regularPrice: string;
  salePrice: string;
  onSale: boolean;
  priceHtml: string;
  images: ProductImage[];
  image: string | null;
  thumbnail: string | null;
  categories: Category[];
  tags: Tag[];
  attributes: Attribute[];
  variations: number[];
  stockStatus: string;
  stockQuantity: number | null;
  inStock: boolean;
  manageStock: boolean;
  soldIndividually: boolean;
  maxQuantity: number;
  backorders: string;
  backordersAllowed: boolean;
  averageRating: string;
  ratingCount: number;
  reviewsAllowed: boolean;
  weight: string;
  dimensions: Dimensions;
  relatedIds: number[];
  upsellIds: number[];
  crossSellIds: number[];
  downloadable: boolean;
  virtual: boolean;
  dateCreated: string;
  dateModified: string;
  permalink: string;
  totalSales: number;
}
// Add these new interfaces after the existing Product interface

export interface ProductVariation {
  id: number;
  date_created: string;
  date_modified: string;
  description: string;
  permalink: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  purchasable: boolean;
  visible: boolean;
  virtual: boolean;
  downloadable: boolean;
  manage_stock: boolean;
  stock_quantity: number | null;
  stock_status: string;
  in_stock: boolean;
  backorders: string;
  backorders_allowed: boolean;
  weight: string;
  dimensions: Dimensions;
  image: ProductImage;
  attributes: VariationAttribute[];
  maxQuantity: number;
}

export interface VariationAttribute {
  id: number;
  name: string;
  option: string;
}

// Update CartItem to include variation
export interface CartItem {
  product_id: number;
  variation_id?: number;
  quantity: number;
  product: Product;
  variation?: ProductVariation;
  selectedAttributes?: { [key: string]: string };
  isStitched?: boolean;
}
export interface ProductImage {
  id: number;
  src: string;
  name: string;
  alt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  image?: string | { src: string; id: number } | null;
  count?: number;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface Attribute {
  id: number;
  name: string;
  position: number;
  visible: boolean;
  variation: boolean;
  options: string[];
}

export interface Dimensions {
  length: string;
  width: string;
  height: string;
}

export interface AttributeTaxonomy {
  id: number;
  name: string;
  slug: string;
  type: string;
  order_by: string;
  has_archives: boolean;
}

export interface AttributeTerm {
  id: number;
  name: string;
  slug: string;
  description: string;
  menu_order: number;
  count: number;
}

// Cart Types
export interface CartItem {
  product_id: number;
  variation_id?: number;
  quantity: number;
  product: Product;
  variation?: ProductVariation;
  selectedAttributes?: { [key: string]: string };
  isStitched?: boolean;
}

export interface ShippingRate {
  rate_id: string;
  name: string;
  description: string;
  delivery_time: string;
  price: string;
  taxes: string;
  method_id: string;
  instance_id: number;
  meta_data: any[];
  selected: boolean;
  currency_code: string;
  currency_symbol: string;
}

export interface CartFee {
  id: string;
  name: string;
  totals: {
    total: string;
    total_tax: string;
  };
}

export interface ShippingPackage {
  package_id: number;
  name: string;
  destination: ShippingAddress;
  items: CartItem[];
  shipping_rates: ShippingRate[];
}

export interface Coupon {
  code: string;
  discount_type: string;
  totals: {
    total_discount: string;
    total_discount_tax: string;
  };
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  total: number;
  itemCount: number;
  shipping_rates?: ShippingPackage[]; // WooCommerce Store API returns packages with rates
  needs_shipping?: boolean;
  coupons?: Coupon[];
  fees?: CartFee[];
  totals?: {
    total_items: string;
    total_items_tax: string;
    total_fees: string;
    total_fees_tax: string;
    total_discount: string;
    total_discount_tax: string;
    total_shipping: string;
    total_shipping_tax: string;
    total_price: string;
    total_tax: string;
    currency_code: string;
    currency_symbol: string;
    currency_minor_unit: number;
  };
  currency_code?: string;
  currency_symbol?: string;
}

// Order Types
export interface Order {
  id: number;
  order_key: string;
  status: string;
  currency: string;
  total: string;
  subtotal: string;
  total_tax: string;
  shipping_total: string;
  discount_total: string;
  line_items: OrderLineItem[];
  billing: BillingAddress;
  shipping: ShippingAddress;
  payment_method: string;
  payment_method_title: string;
  date_created: string;
  date_modified: string;
  refunds?: any[];
  shipping_lines?: { method_id: string; method_title: string; total: string }[];
  fee_lines?: { name: string; total: string }[];
  coupon_lines?: { id: number; code: string; discount: string }[];
}

export interface OrderLineItem {
  id: number;
  name: string;
  product_id: number;
  variation_id: number;
  quantity: number;
  subtotal: string;
  total: string;
  price: number;
  image: ProductImage;
}

export interface BillingAddress {
  first_name: string;
  last_name: string;
  company?: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email: string;
  phone: string;
}

export interface ShippingAddress {
  first_name: string;
  last_name: string;
  company?: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export interface SavedAddress extends BillingAddress {
  id: string;
  label: string;
  isDefault?: boolean;
}

// User Types
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  username?: string;
  avatar?: string;
  billing?: BillingAddress;
  shipping?: ShippingAddress;
  savedAddresses?: SavedAddress[];
}

// Auth Types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  username: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: Pagination;
  count?: number;
}

export interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages?: number;
}

export interface ApiError {
  success: false;
  message: string;
  code: string;
  errors?: any;
}

// Filter Types
export interface ProductFilters {
  category?: string | number;
  tag?: string;
  search?: string;
  min_price?: string;
  max_price?: string;
  on_sale?: boolean;
  featured?: boolean;
  orderby?: 'date' | 'price' | 'popularity' | 'rating';
  order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
  attribute?: string | string[];
  attribute_term?: string | string[];
}

// Wishlist Types
export interface WishlistItem {
  product_id: number;
  added_at: string;
}

// Review Types
export interface Review {
  id: number;
  product_id: number;
  reviewer: string;
  reviewer_email: string;
  review: string;
  rating: number;
  verified: boolean;
  date_created: string;
}

export interface ReviewFormData {
  product_id: number;
  review: string;
  reviewer: string;
  reviewer_email: string;
  rating: number;
}

// Layout Types
export interface HeroBannerData {
  imageUrl: string;
  action?: {
    type: string;
    target_id: number;
  };
}

export interface ProductListData {
  query_type: string;
  api_params: any;
}

export interface CategoryGridData {
  ids?: number[];
}

export interface SectionTitleData {
  text: string;
}

export interface HomeLayoutSection {
  type: 'hero_banner' | 'section_title' | 'product_list' | 'category_grid' | 'micro_animation' | 'beauty_animation' | 'brand_grid';
  title?: string;
  data: HeroBannerData | ProductListData | SectionTitleData | CategoryGridData | any;
  id?: string | number;
}