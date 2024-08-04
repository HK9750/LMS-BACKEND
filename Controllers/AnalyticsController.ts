import CourseModel from "../Models/CourseModel";
import UserModel from "../Models/UserModel";
import OrderModel from "../Models/OrderModel";
import { Request, Response, NextFunction } from "express";
import AsyncErrorHandler from "../utils/AsyncErrorHandler";
import ErrorHandler from "../utils/ErrorHandler";
import { generateLast12MonthsData } from "../utils/AnalyticsGenerator";

export const getUserAnalytics = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await generateLast12MonthsData(UserModel);
      res.status(200).json({
        success: true,
        message: "Here are the analytics of user for the past 12 Months",
        analytics: users,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getCourseAnalytics = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courses = await generateLast12MonthsData(CourseModel);
      res.status(200).json({
        success: true,
        message: "Here are the analytics of courses for the past 12 Months",
        analytics: courses,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getOrderAnalytics = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await generateLast12MonthsData(OrderModel);
      res.status(200).json({
        success: true,
        message: "Here are the analytics of orders for the past 12 Months",
        analytics: orders,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
