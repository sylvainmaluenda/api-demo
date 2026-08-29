import AbortError from "../errors/AbortError.js";

const orderBatchService = {
  config: {
    abortTimeoutMs: 1000,
    batchSize: 100,

    maxAttempts: 3,
    backoff: {
      strategy: "linear",
      incrementMs: 200,
    },

    apiFailureProbability: 0.1,
    apiLatencyMs: {
      min: 10,
      max: 100,
    },
  },

  getDurationEstimated(ordersQuantity = 1_000_000) {
    const {
      batchSize,
      maxAttempts,
      backoff: { incrementMs },
      apiFailureProbability,
      apiLatencyMs: { min: minApiLatency, max: maxApiLatency },
    } = this.config;

    let msEstimated = 0;
    const averageApiLatency = (maxApiLatency + minApiLatency) / 2;

    for (let i = 0; i < maxAttempts; i++) {
      if (i === 0) {
        msEstimated = (ordersQuantity / batchSize) * averageApiLatency;
      }
      msEstimated += apiFailureProbability * msEstimated + i * incrementMs;
    }

    return Number(msEstimated.toFixed());
  },

  formatDuration(ms) {
    if (ms < 1000) {
      return `${ms} ms`;
    }

    const hours = Math.floor(ms / 3_600_000);
    const minutes = Math.floor((ms % 3_600_000) / 60_000);
    const seconds = Math.floor((ms % 60_000) / 1_000);

    if (hours === 0 && minutes === 0) {
      return `${seconds} sec`;
    }

    if (hours === 0) {
      return `${minutes} min ${seconds} sec`;
    }

    return `${hours} h ${minutes} min ${seconds} sec`;
  },

  async processOrders(orders, signal) {
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
      retryCount = i - 1;

      // Backoff linear strategy
      if (i > 1) {
        await new Promise((resolve) => {
          setTimeout(resolve, incrementMs * (i - 1));
        });
      }

      // Batch process
      for (let i = 0; i < ordersToRetry.length; i += batchSize) {
        const batch = ordersToRetry.slice(i, i + batchSize);

        const batchResults = await Promise.all(
          batch.map((order) => this.processOrder(order, signal)),
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

    if (response.ok) {
      const data = response.json();
      return data;
    }
  },
};

export default orderBatchService;
