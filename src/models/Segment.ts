import mongoose, { Schema, model, models, type Model } from "mongoose";
import type { SegmentGroup } from "@/modules/segments/evaluate";

export interface ISegment {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  root: SegmentGroup;
  createdAt: Date;
  updatedAt: Date;
}

const segmentSchema = new Schema<ISegment>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    root: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

export const Segment: Model<ISegment> =
  (models.Segment as Model<ISegment>) ??
  model<ISegment>("Segment", segmentSchema);
