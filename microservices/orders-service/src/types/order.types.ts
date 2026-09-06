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

export interface CreateOrderDto {
  userId: number;
  products: Products[];
}
