// Report
export interface Report {
  status: ReportStatus;
  sent: number;
  succeed: number;
  failed: number;
  duration: number;
  results: ReportResults;
}

type ReportStatus = "aborted" | "completed";

export interface ReportResults {
  succeedOrders: OrderResult[];
  failedOrders: OrderResult[];
}

// Raw results
export interface PageResult {
  pageId: number;
  pageResults: AttemptResult[];
}

export interface AttemptResult {
  attemptId: number;
  batches: OrderBatch[];
}

export interface OrderBatch {
  batchId: number;
  results: OrderResult[];
}

export type OrderResult = OrderResultSuccess | OrderResultError;

export interface OrderResultSuccess {
  orderId: number;
  success: boolean;
}

export interface OrderResultError {
  orderId: number;
  error: string;
}

// Orders
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
