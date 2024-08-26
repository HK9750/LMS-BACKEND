import NotificationModel from "../Models/NotificationModel";
import AsyncErrorHandler from "../utils/AsyncErrorHandler";
import ErrorHandler from "../utils/ErrorHandler";
import { Request, Response, NextFunction } from "express";
import redis from "../utils/redis";
import cron from "node-cron";

export const getAllNotifications = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // const cachedNotifications = await redis.get("allNotifications");
      // if (cachedNotifications) {
      //   const notifications = JSON.parse(cachedNotifications);
      //   console.log("Hitting the redis");
      //   res.status(200).json({
      //     success: true,
      //     message: "GET request for user Notifications successful",
      //     notifications,
      //   });
      // } else {
      const notifications = await NotificationModel.find().sort({
        createdAt: -1,
      });
      await redis.set("allNotifications", JSON.stringify(notifications));
      console.log("Hitting mongodb");
      res.status(200).json({
        success: true,
        message: "GET request for user Notifications successful",
        notifications,
      });
      // }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const updateNotification = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notificationId = req.params.id;
      const notification = await NotificationModel.findById(notificationId);
      if (!notification) {
        return next(new ErrorHandler("Notification not found", 404));
      }
      notification.isRead = true;
      await notification.save();
      redis.del("allNotifications");
      res.status(200).json({
        success: true,
        message: "Notification updated successfully",
        notification,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

cron.schedule("0 0 * * *", async () => {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const result = await NotificationModel.deleteMany({
      createdAt: { $lt: oneWeekAgo },
    });

    if (result.deletedCount > 0) {
      await redis.del("allNotifications");
      console.log(
        `Deleted ${result.deletedCount} notifications and cleared cache.`
      );
    } else {
      console.log("No notifications to delete.");
    }
  } catch (error: any) {
    console.error("Error deleting notifications:", error.message);
  }
});
