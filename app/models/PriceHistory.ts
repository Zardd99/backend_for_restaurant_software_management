import mongoose, { Document, Schema, Types } from "mongoose";

export interface IPriceHistory extends Document {
  menuItem: Types.ObjectId;
  oldPrice: number;
  newPrice: number;
  changedBy: Types.ObjectId;
  changeDate: Date;
}

const priceHistorySchema: Schema = new Schema({
  menuItem: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
  oldPrice: { type: Number, required: true },
  newPrice: { type: Number, required: true },
  changedBy: { type: Schema.Types.ObjectId, ref: "User" },
  changeDate: { type: Date, default: Date.now },
});

export default mongoose.model<IPriceHistory>(
  "PriceHistory",
  priceHistorySchema
);
