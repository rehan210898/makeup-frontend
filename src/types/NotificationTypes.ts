export type NotificationType = 
  | 'ORDER_UPDATE' 
  | 'ORDER_CONFIRMATION' 
  | 'CART_ABANDONMENT' 
  | 'PRODUCT_RESTOCK' 
  | 'PROMOTION';

export interface BaseNotificationData {
  type: NotificationType;
  click_action?: string; // e.g., 'muoapp://orders/123'
}

export interface OrderNotificationData extends BaseNotificationData {
  type: 'ORDER_UPDATE' | 'ORDER_CONFIRMATION';
  orderId: number;
  status: string;
}

export interface CartNotificationData extends BaseNotificationData {
  type: 'CART_ABANDONMENT';
  cartKey: string;
  itemCount: number;
}

export interface ProductNotificationData extends BaseNotificationData {
  type: 'PRODUCT_RESTOCK';
  productId: number;
  productName: string;
}

export interface PromotionNotificationData extends BaseNotificationData {
  type: 'PROMOTION';
  code?: string;
  url?: string;
}

export type NotificationPayload = 
  | OrderNotificationData 
  | CartNotificationData 
  | ProductNotificationData 
  | PromotionNotificationData;
