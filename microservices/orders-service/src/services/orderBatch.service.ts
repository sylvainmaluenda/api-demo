import config from "../../config/ordersService.config.js";
import AbortError from "../errors/AbortError.js";
import AppError from "../errors/AppError.js";
import { Order } from "../types/order.types.js";
import {
  OrderResult,
  OrderBatch,
  AttemptResult,
  Report,
} from "../types/sendReminders.types.js";

const orderBatchService = {
  async processOrders(
    orders: Order[],
    signal: AbortSignal,
  ): Promise<AttemptResult[]> {
    console.log(
      `Process started for ${orders.length} orders with status "pending"...`,
    );

    const ordersMap: Map<number, Order> = new Map(
      orders.map((order) => [order.id, order]),
    );
    // ordersMap used to avoid O(n²) complexity
    // in building the failed orders array to retry

    const {
      batchSize,
      maxConcurrency,
      maxAttempts,
      backoff: { incrementMs },
    } = config;

    if (maxConcurrency >= batchSize) {
      throw new AppError("batchSize must be superior to maxConcurrency", 400);
    }

    let results: AttemptResult[] = [];

    let ordersToProcess: Order[] = orders;

    // Retry process management
    for (let attemptId: number = 1; attemptId <= maxAttempts; attemptId++) {
      console.log(`Attempt #${attemptId} :`);

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
      const batchesCount = Math.ceil(ordersToProcess.length / batchSize);

      for (let i = 0; i < ordersToProcess.length; i += batchSize) {
        console.log(`Start batch ${batchId}/${batchesCount} treatment...`);

        batches.push({
          batchId,
          results: [],
        });

        const batchOrders: Order[] = ordersToProcess.slice(i, i + batchSize);

        for (let j = 0; j < batchOrders.length; j += maxConcurrency) {
          const concurrencyOrders: Order[] = batchOrders.slice(
            j,
            j + maxConcurrency,
          );

          const results: OrderResult[] = await Promise.all(
            concurrencyOrders.map((order) => this.processOrder(order, signal)),
          );

          batches[batchId - 1].results.push(...results);
        }

        batchId++;
      }

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

      /*
      const ordersFailed: Order[] = results[attemptId - 1].batches.flatMap(
        (batch) =>
          batch.results
            .filter((result): result is OrderResultError => "error" in result)
            .map((result) => ordersMap.get(result.orderId)!),
      );
      */

      ordersToProcess = ordersFailed;

      if (ordersToProcess.length === 0 || signal.aborted) {
        break;
      }
    }

    // console.dir(results, { depth: null });
    return results;
  },

  async processOrder(order: Order, signal: AbortSignal): Promise<OrderResult> {
    try {
      const response = await fetch(
        "http://localhost:3001/notifications/send-email",
        {
          signal: signal,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            order,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new AppError(data.error, response.status);
      }

      return data;
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") {
        return {
          orderId: order.id,
          error: new AbortError("The operation was aborted due to timeout"),
        };
      }
      throw error;
    }
  },

  getReport(
    ordersSize: number,
    rawResults: AttemptResult[],
    timeStamp: number,
    signal: AbortSignal,
  ): Report {
    //remove failed order duplications
    const ordersResultsMap = new Map();
    for (const attempt of rawResults) {
      for (const batch of attempt.batches) {
        for (const result of batch.results) {
          ordersResultsMap.set(result.orderId, result);
        }
      }
    }

    if (ordersResultsMap.size !== ordersSize) {
      throw new Error(
        "Total of orders processeed are different from orders length",
      );
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
      retryCount: rawResults.length,

      sent: ordersSize,

      succeed: succeedOrders.length,
      failed: failedOrders.length,
      aborted: abortedOrders.length,

      duration: Date.now() - timeStamp,

      results: {
        succeedOrders: succeedOrders,
        failedOrders: failedOrders,
        abortedOrders: abortedOrders,
      },
    };

    return report;
  },
};

export default orderBatchService;
