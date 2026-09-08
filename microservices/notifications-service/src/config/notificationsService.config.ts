const config = {
  port: 3001,

  abortTimeOutMs: 20_000,
  batchOrderSize: 1_000,
  batchSmtpSize: 22,

  maxAttempts: 3,
  backoff: {
    strategy: "linear",
    incrementMs: 200,
  },

  apiSmtpFailureProbability: 0.1,
  apiSmtpLatencyMs: {
    min: 10,
    max: 50,
  },
};

export default config;
