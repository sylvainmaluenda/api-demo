import config from "../config/notificationsService.config.js";
import AbortError from "../errors/AbortError.js";
import AppError from "../errors/AppError.js";
import {
  Order,
  OrderResultSuccess,
  OrderResultError,
  OrderResult,
  OrderBatch,
  AttemptResult,
  PageResult,
  Report,
  OrderStatus,
} from "../types/notifications.types.js";

const notificationService = {
  async sendReminders(): Promise<Report> {
    const { batchOrderSize } = config;

    let page: number = 1;
    const limit: number = batchOrderSize;
    const rawResults: PageResult[] = [];

    const signal: AbortSignal = AbortSignal.timeout(config.abortTimeOutMs);

    const timeStamp: number = Date.now();

    const totalPendingOrders = await this.getCountOrders("pending");

    while (true) {
      if (signal.aborted) {
        console.log("\nProcess aborted due to timeout");
        break;
      }

      console.log(`\nLoading pending orders page #${page}...`);

      const orders = await this.getPendingOrders(page, limit, signal);

      if (orders.length === 0) {
        throw new AppError("No order exists with a pending status", 404);
      }

      const pageResults = await this.processOrders(orders, signal);
      rawResults.push({ pageId: page, pageResults });

      if (orders.length < limit) {
        break;
      }

      page++;
    }

    return this.getReport(totalPendingOrders, rawResults, timeStamp, signal);
  },

  async getCountOrders(status: OrderStatus | undefined) {
    const url = !status
      ? `http://localhost:3000/orders/count`
      : `http://localhost:3000/orders/count?status=${status}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      throw new AppError(data.error, response.status);
    }

    return data.count;
  },

  async getPendingOrders(page: number, limit: number, signal: AbortSignal) {
    const response = await fetch(
      `http://localhost:3000/orders?status=pending&page=${page}&limit=${limit}`,
      {
        signal: signal,
      },
    );

    if (!response.ok) {
      throw new AppError("Service orders is currently unavailable", 500);
    }

    const data: Order[] = await response.json();
    return data;
  },

  async processOrders(
    orders: Order[],
    signal: AbortSignal,
  ): Promise<AttemptResult[]> {
    const ordersMap: Map<number, Order> = new Map(
      orders.map((order) => [order.id, order]),
    );
    // ordersMap used to avoid O(n²) complexity
    // in building the failed orders array to retry

    const {
      batchSmtpSize,
      maxAttempts,
      backoff: { incrementMs },
    } = config;

    let results: AttemptResult[] = [];

    let ordersToProcess: Order[] = orders;

    // Retry process management
    for (let attemptId: number = 1; attemptId <= maxAttempts; attemptId++) {
      if (signal.aborted) {
        break;
      }

      results.push({ attemptId, batches: [] });

      // Backoff linear strategy
      if (attemptId > 1) {
        await new Promise((resolve) => {
          setTimeout(resolve, incrementMs * attemptId);
        });
      }

      // Batch process
      let batches: OrderBatch[] = [];
      let batchId = 1;

      let processedOrders = 0;

      for (let i = 0; i < ordersToProcess.length; i += batchSmtpSize) {
        if (signal.aborted) {
          break;
        }

        batches.push({
          batchId,
          results: [],
        });

        const batchOrders: Order[] = ordersToProcess.slice(
          i,
          i + batchSmtpSize,
        );

        const results: OrderResult[] = await Promise.all(
          batchOrders.map((order) => this.processOrder(order, signal)),
        );

        processedOrders += results.length;
        const percentage = (processedOrders / ordersToProcess.length) * 100;
        process.stdout.write(
          `\rAttempt #${attemptId}: ${percentage.toFixed(1)}% (${processedOrders}/${ordersToProcess.length})`,
        );

        batches[batchId - 1].results.push(...results);

        batchId++;
      }

      process.stdout.write("\n");

      results[attemptId - 1].batches.push(...batches);

      // Get orders to retry from results
      const ordersFailed: Order[] = results[attemptId - 1].batches.reduce(
        (acc: Order[], batch) => {
          for (const orderResult of batch.results) {
            if ("error" in orderResult) {
              acc.push(ordersMap.get(orderResult.orderId)!);
            }
          }
          return acc;
        },
        [],
      );

      ordersToProcess = ordersFailed;

      if (ordersToProcess.length === 0) {
        break;
      }
    }

    // console.dir(results, { depth: null });

    return results;
  },

  async processOrder(order: Order, signal: AbortSignal): Promise<OrderResult> {
    const {
      apiSmtpFailureProbability,
      apiSmtpLatencyMs: { min: minApiLatency, max: maxApiLatency },
    } = config;

    try {
      if (Math.random() < apiSmtpFailureProbability) {
        throw new Error(`Failed to process order #${order.id}`);
      }

      const simulatedLatencyMs = Math.floor(
        Math.random() * (maxApiLatency - minApiLatency + 1) + minApiLatency,
      );

      await new Promise((resolve) => {
        setTimeout(resolve, simulatedLatencyMs);
      });

      const orderResultSuccess: OrderResultSuccess = {
        orderId: order.id,
        success: true,
      };

      return orderResultSuccess;
    } catch (error) {
      if (error instanceof Error) {
        const orderResultError: OrderResultError = {
          orderId: order.id,
          error: error.message,
        };

        return orderResultError;
      }

      throw error;
    }
  },

  getReport(
    ordersSize: number,
    rawResults: PageResult[],
    timeStamp: number,
    signal: AbortSignal,
  ): Report {
    //remove failed order duplications
    const ordersResultsMap = new Map();
    for (const page of rawResults) {
      for (const attempt of page.pageResults) {
        for (const batch of attempt.batches) {
          for (const result of batch.results) {
            ordersResultsMap.set(result.orderId, result);
          }
        }
      }
    }

    const succeedOrders: OrderResult[] = [...ordersResultsMap.values()].filter(
      (order) => order.success,
    );

    const failedOrders: OrderResult[] = [...ordersResultsMap.values()].filter(
      (order) => order.error && !(order.error instanceof AbortError),
    );

    const abortedOrders: OrderResult[] = [...ordersResultsMap.values()].filter(
      (order) => order.error instanceof AbortError,
    );

    const report: Report = {
      status: signal.aborted ? "aborted" : "completed",

      sent: ordersSize,

      succeed: succeedOrders.length,
      failed: failedOrders.length,

      duration: Date.now() - timeStamp,

      results: {
        succeedOrders: succeedOrders,
        failedOrders: failedOrders,
      },
    };

    return report;
  },
};

export default notificationService;
