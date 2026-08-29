const notificationService = {
  config: {
    mailFailureProbability: 0.1,
    mailLatencyMs: {
      min: 10,
      max: 200,
    },
  },

  async fakeSendEmail(order) {
    const {
      mailFailureProbability,
      mailLatencyMs: { min: minApiLatency, max: maxApiLatency },
    } = this.config;

    if (Math.random() < mailFailureProbability) {
      return {
        orderId: order.id,
        error: new Error(`Failed to process order ${order.id}`),
      };
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
  },
};

export default notificationService;
