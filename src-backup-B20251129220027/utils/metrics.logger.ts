// lightweight in-memory metrics sink (Day-1). Replace with proper sink later.
type Metrics = {
  timestamp: number;
  userId?: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estCost: number;
};

const metricsStore: Metrics[] = [];

export const logCall = (m: Metrics) => {
  metricsStore.push(m);
  // For day-1, keep it small: print a summary line
  console.log(`[METRICS] user=${m.userId || "anon"} model=${m.model} tokens=${m.totalTokens} cost=${m.estCost.toFixed(6)}`);
};

export const getMetrics = () => metricsStore.slice(-200);
