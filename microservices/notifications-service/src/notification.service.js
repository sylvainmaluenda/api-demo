import config from "../config/notificationsService.config.js";

const notificationService = {
  async fakeSendEmail(order) {
    const {
      apiFailureProbability,
      apiLatencyMs: { min: minApiLatency, max: maxApiLatency },
    } = config;

    try {
      if (Math.random() < apiFailureProbability) {
        throw new Error(`Failed to process order ${order.id}`);
      }

      const simulatedLatencyMs = Math.floor(
        Math.random() * (maxApiLatency - minApiLatency + 1) + minApiLatency,
      );

      await new Promise((resolve) => {
        setTimeout(resolve, simulatedLatencyMs);
      });

      return {
        orderId: order.id,
        success: true,
      };
    } catch (error) {
      return {
        orderId: order.id,
        error: error.message,
      };
    }
  },
};

export default notificationService;
