interface BackOff {
  strategy: string;
  incrementMs: number;
}

interface Config {
  port: number;
  orderSize: number;
  abortTimeOutMs: number;
  batchSize: number;
  maxConcurrency: number;
  maxAttempts: number;
  backoff: BackOff;
}

const config: Config = {
  port: 3000,

  orderSize: 20_000,

  abortTimeOutMs: 30_000,
  batchSize: 500,
  maxConcurrency: 20,

  maxAttempts: 3,
  backoff: {
    strategy: "linear",
    incrementMs: 200,
  },
};

export default config;
