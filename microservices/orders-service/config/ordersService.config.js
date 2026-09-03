const config = {
  port: 3000,

  orderSize: 10_000,

  abortTimeOutMs: 10_000,
  batchSize: 1000,
  maxConcurrency: 200,

  maxAttempts: 3,
  backoff: {
    strategy: "linear",
    incrementMs: 200,
  },
};

export default config;
