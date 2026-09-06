export interface OrderResultSuccess {
  orderId: number;
  success: boolean;
}

export interface OrderResultError {
  orderId: number;
  error: Error;
}

export type OrderResult = OrderResultSuccess | OrderResultError;

export interface SendEmailBody {
  order: Order;
}

export type OrderStatus = "pending" | "confirmed" | "shipped" | "cancelled";

export interface Products {
  productId: number;
  price: number;
  quantity: number;
}

export interface Order {
  id: number;
  userId: number;
  products: Products[];
  amount: number;
  status: OrderStatus;
}
