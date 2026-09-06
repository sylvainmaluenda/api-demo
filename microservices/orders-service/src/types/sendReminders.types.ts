export interface OrderResultSuccess {
  orderId: number;
  success: boolean;
}

export interface OrderResultError {
  orderId: number;
  error: Error;
}

export type OrderResult = OrderResultSuccess | OrderResultError;

export interface OrderBatch {
  batchId: number;
  results: OrderResult[];
}

export interface AttemptResult {
  attemptId: number;
  batches: OrderBatch[];
}

type ReportStatus = "aborted" | "completed";

export interface ReportResults {
  succeedOrders: OrderResult[];
  failedOrders: OrderResult[];
  abortedOrders: OrderResult[];
}

export interface Report {
  status: ReportStatus;
  retryCount: number;
  sent: number;
  succeed: number;
  failed: number;
  aborted: number;
  duration: number;
  results: ReportResults;
}
