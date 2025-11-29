"use strict";
// src/models/metrics.model.ts
// In-memory metrics model with chainable find().sort().limit().lean()
Object.defineProperty(exports, "__esModule", { value: true });
const metricsStore = [];
const MetricsModel = {
    async create(doc) {
        const id = (Math.floor(Math.random() * 1e9)).toString();
        const now = new Date();
        const record = { _id: id, createdAt: now, updatedAt: now, ...doc };
        metricsStore.push(record);
        return Promise.resolve(record);
    },
    find(query = {}) {
        const results = metricsStore.filter((m) => {
            for (const k of Object.keys(query)) {
                if (m[k] !== query[k])
                    return false;
            }
            return true;
        });
        // chainable query-like object
        return {
            _results: results,
            sort(sortObj) {
                if (sortObj && sortObj.createdAt === -1) {
                    this._results.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
                }
                return this;
            },
            limit(n) {
                this._results = this._results.slice(0, n);
                return this;
            },
            lean() {
                return Promise.resolve(this._results);
            },
        };
    },
};
exports.default = MetricsModel;
