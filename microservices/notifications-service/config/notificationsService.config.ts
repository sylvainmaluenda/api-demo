interface ApiLatency {
  min: number;
  max: number;
}

interface Config {
  port: number;
  apiFailureProbability: number;
  apiLatencyMs: ApiLatency;
}

const config: Config = {
  port: 3001,

  apiFailureProbability: 0.1,
  apiLatencyMs: {
    min: 10,
    max: 50,
  },
};

export default config;
