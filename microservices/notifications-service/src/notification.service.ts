import config from "../config/notificationsService.config.js";
import {
  Order,
  OrderResult,
  OrderResultSuccess,
  OrderResultError,
} from "./types/notifications.types.js";

const notificationService = {
  async fakeSendEmail(order: Order): Promise<OrderResult> {
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

      const orderResultSuccess: OrderResultSuccess = {
        orderId: order.id,
        success: true,
      };

      return orderResultSuccess;
    } catch (error) {
      if (error instanceof Error) {
        const orderResultError: OrderResultError = {
          orderId: order.id,
          error: error,
        };

        return orderResultError;
      }

      throw error;
    }
  },
};

export default notificationService;
