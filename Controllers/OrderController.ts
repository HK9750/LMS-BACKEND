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
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

interface IOrderBody {
  courseId: string;
  paymentInfo?: any;
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
      if (paymentInfo && paymentInfo?.id) {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          paymentInfo.id
        );

        if (paymentIntent.status !== "succeeded") {
          return next(new ErrorHandler("Payment not successful", 400));
        }
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
        title: "Order Placed for " + course.name,
        message: "Your order has been placed successfully for " + course.name,
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

export const sendStripePublishableKey = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!process.env.STRIPE_PUBLISHABLE_KEY) {
      return next(new ErrorHandler("Stripe publishable key not found", 500));
    }
    res.status(200).json({
      success: true,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  }
);

export const newPayment = AsyncErrorHandler(
  async (req: Request & { user: any }, res: Response, next: NextFunction) => {
    try {
      const { amount, courseId } = req.body;

      if (!req.user) {
        return next(new ErrorHandler("User not found", 404));
      }

      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "usd",
        description: `Payment for course: ${course.name}`,
        metadata: {
          userId: req.user._id.toString(),
          courseId: courseId.toString(),
        },
        shipping: {
          name: req.user.name || "John Doe",
          address: {
            line1: "1234 Main St",
            line2: "",
            city: "Anytown",
            state: "CA",
            postal_code: "12345",
            country: "US",
          },
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.status(200).json({
        success: true,
        client_secret: paymentIntent.client_secret,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
