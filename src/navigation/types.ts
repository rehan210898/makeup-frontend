import { NavigatorScreenParams } from '@react-navigation/native';

// Bottom Tab Navigator
export type BottomTabParamList = {
  HomeTab: undefined;
  CategoriesTab: undefined;
  CartTab: undefined;
  ProfileTab: undefined;
};

// Root Stack Navigator
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<BottomTabParamList>;
  ProductDetail: { productId: number };
  ProductList: { categoryId?: number; categoryName?: string; search?: string };
  Checkout: undefined;
  OrderConfirmation: { orderId: number };
  OrderTracking: { orderId: number; fromCheckout?: boolean };
  Refund: { orderId: number };
  Login: undefined;
  Register: undefined;
  VerifyEmail: { email: string; token?: string; password?: string };
  OrderHistory: undefined;
  Wishlist: undefined;
  Address: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}