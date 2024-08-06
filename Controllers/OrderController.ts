import UserModel from "../Models/UserModel";
import OrderModel from "../Models/OrderModel";
import { Request, Response, NextFunction } from "express";
import NotificationModel from "../Models/NotificationModel";
import AsyncErrorHandler from "../utils/AsyncErrorHandler";
import ErrorHandler from "../utils/ErrorHandler";
import CourseModel from "../Models/CourseModel";
import path from "path";
import ejs from "ejs";
import { sendMail } from "../utils/sendMail";

interface IOrderBody {
  courseId: string;
  paymentInfo?: Object;
}

export const createOrder = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.user === undefined) {
        return next(new ErrorHandler("User not found", 404));
      }
      const user = await UserModel.findById(req.user._id);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }
      const { courseId, paymentInfo }: IOrderBody = req.body;

      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      const isCoursePurchased = user.courses?.some(
        (course: any) => course.courseId.toString() === courseId.toString()
      );
      if (isCoursePurchased) {
        return next(new ErrorHandler("Course already purchased", 400));
      }

      const data = {
        userId: user._id,
        courseId,
        paymentInfo,
      };

      const mailData = {
        _id: course._id,
        name: course.name,
        price: course.price,
        date: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      };

      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/Order.ejs"),
        mailData
      );

      try {
        await sendMail({
          to: user.email,
          subject: "Order Placed",
          template: "Order.ejs",
          data: mailData,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }

      user.courses.push({ courseId });
      await user.save();

      course.purchased = (course.purchased || 0) + 1;
      await course.save();

      const order = await OrderModel.create(data);

      const notificationData = {
        userId: user._id,
        title: "Order Placed",
        message: "Your order has been placed successfully",
      };
      await NotificationModel.create(notificationData);

      return res.status(200).json({
        success: true,
        message: "Order Placed Successfully",
        order,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getAllOrders = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await OrderModel.find().sort({ createdAt: -1 });
      res.status(200).json({
        success: true,
        message: "GET request for all orders successful",
        orders,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
