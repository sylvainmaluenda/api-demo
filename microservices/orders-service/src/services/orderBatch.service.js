import AbortError from "../errors/AbortError.js";
import AppError from "../errors/AppError.js";

const orderBatchService = {
  config: {
    batchSize: 100,

    maxAttempts: 3,
    backoff: {
      strategy: "linear",
      incrementMs: 200,
    },
  },

  async processOrders(orders, signal) {
    console.log("Process started...");

    const ordersMap = new Map(orders.map((order) => [order.id, order]));
    // ordersMap used to avoid O(n²) complexity
    // in building the failed orders array to retry

    const {
      batchSize,
      maxAttempts,
      backoff: { incrementMs },
    } = this.config;

    let results = new Map(); // Set ne permet pas le remplacemenet d'éléments
    let ordersToRetry = orders;
    let retryCount = 0;

    // Retry process management
    for (let i = 1; i <= maxAttempts; i++) {
      console.log(`Attempt #${i} :`);

      retryCount = i - 1;

      // Backoff linear strategy
      if (i > 1) {
        await new Promise((resolve) => {
          setTimeout(resolve, incrementMs * (i - 1));
        });
      }

      // Batch process
      let batchIndex = 0;

      for (let i = 0; i < ordersToRetry.length; i += batchSize) {
        const orderBatch = ordersToRetry.slice(i, i + batchSize);

        console.log(`Start batch[${batchIndex++}] treatment...`);

        const batchResults = await Promise.all(
          orderBatch.map((order) => this.processOrder(order, signal)),
        );

        batchResults.forEach((batchResult) =>
          results.set(batchResult.orderId, batchResult),
        );
      }

      // Get orders to retry from results
      ordersToRetry = [...results.values()]
        .filter((result) => result.error)
        .map((failed) => ordersMap.get(failed.orderId));

      if (ordersToRetry.length === 0 || signal.aborted) {
        break;
      }
    }

    return {
      retryCount: retryCount,
      results: [...results.values()],
    };
  },

  async processOrder(order, signal) {
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
      if (error.name === "TimeoutError") {
        return {
          orderId: order.id,
          error: new AbortError("The operation was aborted due to timeout"),
        };
      }
      throw error;
    }
  },

  getReport(ordersSize, rawResults, startTime, signal) {
    let succeedOrdersIds = [];
    let failedOrdersIds = [];
    let abortedOrdersIds = [];

    for (const result of rawResults.results) {
      if (result.success) {
        succeedOrdersIds.push(result.orderId);
      }

      if (result.error) {
        if (result.error instanceof AbortError) {
          abortedOrdersIds.push(result.orderId);
        } else {
          failedOrdersIds.push(result.orderId);
        }
      }
    }

    if (
      succeedOrdersIds.length +
        failedOrdersIds.length +
        abortedOrdersIds.length !==
      ordersSize
    ) {
      throw new Error(
        "Report error: sums of results are different from orders size",
      );
    }

    const report = {
      status: signal.aborted ? "aborted" : "completed",
      retryCount: rawResults.retryCount,

      sent: ordersSize,

      succeed: succeedOrdersIds.length,
      failed: failedOrdersIds.length,
      aborted: abortedOrdersIds.length,

      duration: new Date() - startTime,

      results: {
        succeedOrdersIds: succeedOrdersIds,
        failedOrdersIds: failedOrdersIds,
        abortedOrdersIds: abortedOrdersIds,
      },
    };

    return report;
  },
};

export default orderBatchService;
