import mongoose, { Document, Schema, Model } from "mongoose";

interface Notification extends Document {
  message: string;
  isRead: Boolean;
  userId: string;
}

const notificationSchema: Schema<Notification> = new Schema({
  message: {
    type: String,
    required: [true, "Please enter notification message"],
  },
  isRead: {
    type: Boolean,
    default: false,
  },
});
