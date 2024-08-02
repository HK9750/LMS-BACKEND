import AsyncErrorHandler from "../utils/AsyncErrorHandler";
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import ErrorHandler from "../utils/ErrorHandler";
import redis from "../utils/redis";

export const Authenticate = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const access_token = req.cookies.accessToken;
      if (!access_token) {
        return next(new ErrorHandler("Please login to access this route", 401));
      }
      const decoded = jwt.verify(
        access_token,
        process.env.JWT_ACCESS_SECRET as string
      ) as JwtPayload;
      if (!decoded) {
        return next(new ErrorHandler("Invalid token", 401));
      }
      const user = await redis.get(decoded.id);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }
      req.user = JSON.parse(user as string);
      next();
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const Authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role as string)) {
      return next(
        new ErrorHandler("You are not authorized to access this route", 403)
      );
    }
    next();
  };
};
