import mongoose, { Document, Schema, Model } from "mongoose";

interface Notification extends Document {
  title: string;
  message: string;
  isRead: Boolean;
  userId: string;
}

const notificationSchema: Schema<Notification> = new Schema({
  userId: {
    type: String,
    required: [true, "Please enter user id"],
  },
  title: {
    type: String,
    required: [true, "Please enter notification title"],
  },
  message: {
    type: String,
    required: [true, "Please enter notification message"],
  },
  isRead: {
    type: Boolean,
    default: false,
  },
});

const NotificationModel: Model<Notification> = mongoose.model(
  "Notification",
  notificationSchema
);

export default NotificationModel;
