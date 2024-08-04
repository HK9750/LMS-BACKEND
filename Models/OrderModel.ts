import mongoose, { Schema, Model, Document } from "mongoose";

export interface IOrder extends Document {
  courseId: string;
  userId: string;
  paymentInfo?: object;
}

const OrderSchema: Schema<IOrder> = new Schema(
  {
    courseId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    paymentInfo: {
      type: Object,
    },
  },
  { timestamps: true }
);

const orderModel: Model<IOrder> = mongoose.model("Order", OrderSchema);

export default orderModel;
