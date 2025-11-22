// src/models/metrics.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IMetrics extends Document {
  userId: mongoose.Types.ObjectId | string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estCost?: number;
  createdAt: Date;
  meta?: any;
}

const MetricsSchema = new Schema<IMetrics>({
  userId: { type: Schema.Types.ObjectId, index: true },
  provider: String,
  model: String,
  promptTokens: Number,
  completionTokens: Number,
  totalTokens: Number,
  estCost: Number,
  meta: Schema.Types.Mixed
}, { timestamps: { createdAt: true, updatedAt: false } });

const Metrics = mongoose.models.Metrics || mongoose.model<IMetrics>('Metrics', MetricsSchema);
export default Metrics;
