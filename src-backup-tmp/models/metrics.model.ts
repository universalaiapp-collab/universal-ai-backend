// src/models/metrics.model.ts
// In-memory metrics model with chainable find().sort().limit().lean()

export interface IMetrics {
  _id?: string;
  userId?: string;
  model?: string;
  tokens?: number;
  cost?: number;
  createdAt?: Date;
  updatedAt?: Date;
  [k: string]: any;
}

const metricsStore: IMetrics[] = [];

const MetricsModel = {
  async create(doc: IMetrics) {
    const id = (Math.floor(Math.random() * 1e9)).toString();
    const now = new Date();
    const record: IMetrics = { _id: id, createdAt: now, updatedAt: now, ...doc };
    metricsStore.push(record);
    return Promise.resolve(record);
  },

  find(query: Partial<IMetrics> = {}) {
    const results = metricsStore.filter((m) => {
      for (const k of Object.keys(query)) {
        if ((m as any)[k] !== (query as any)[k]) return false;
      }
      return true;
    });

    // chainable query-like object
    return {
      _results: results,
      sort(sortObj: any) {
        if (sortObj && sortObj.createdAt === -1) {
          this._results.sort((a: IMetrics, b: IMetrics) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
        }
        return this;
      },
      limit(n: number) {
        this._results = (this._results as IMetrics[]).slice(0, n);
        return this;
      },
      lean() {
        return Promise.resolve(this._results);
      },
    } as any;
  },
};

export default MetricsModel;
