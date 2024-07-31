import ErrorHandler from "../utils/ErrorHandler";
import AsyncErrorHandler from "../utils/AsyncErrorHandler";
import { Request, Response, NextFunction } from "express";
import UserModel, { IUser } from "../Models/UserModel";
import jwt from "jsonwebtoken";
import redis from "../utils/redis";
import { sendMail } from "../utils/sendMail";
import { sendToken } from "../utils/jwtTokens";

interface iRegisterUserBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

interface iLoginUserBody {
  email: string;
  password: string;
}

interface iActivationToken {
  activationToken: string;
  activationCode: string;
}

export const registerUser = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body as iRegisterUserBody;
      const isUserExists = await UserModel.findOne({ email });
      if (isUserExists) {
        return next(new ErrorHandler("Email already exists", 400));
      }
      const user: iRegisterUserBody = {
        name,
        email,
        password,
      };
      const { activationCode, activationToken } = createActivationToken(user);
      const data = { user: user.name, code: activationCode };
      try {
        await sendMail({
          to: email,
          subject: "Account Activation",
          template: "activation.ejs",
          data,
        });
        res.status(200).json({
          success: true,
          message: `Account activation email sent successfully to ${email}`,
          token: activationToken,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

const createActivationToken = (user: iRegisterUserBody): iActivationToken => {
  const activationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const activationToken = jwt.sign(
    { user, activationCode },
    process.env.ACTIVATION_SECRET as string,
    {
      expiresIn: process.env.ACTIVATION_EXPIRY,
    }
  );
  return { activationToken, activationCode };
};

export const activateUser = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activationCode, activationToken } = req.body as iActivationToken;
      const decoded: { user: IUser; activationCode: string } = jwt.verify(
        activationToken,
        process.env.ACTIVATION_SECRET as string
      ) as { user: IUser; activationCode: string };
      if (decoded.activationCode !== activationCode) {
        return next(new ErrorHandler("Invalid activation token", 400));
      }
      const { name, email, password } = decoded.user;
      const user = await UserModel.create({ name, email, password });
      try {
        sendToken({
          user,
          statusCode: 201,
          res,
          message: "Account activated and logged in successfully",
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const loginUser = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as iLoginUserBody;
      const user = await UserModel.findOne({ email }).select("+password");
      if (!user) {
        return next(new ErrorHandler("Invalid credentials", 400));
      }
      const isPasswordMatch = await user.comparePassword(password);
      if (!isPasswordMatch) {
        return next(new ErrorHandler("Invalid credentials", 400));
      }
      try {
        sendToken({
          user,
          statusCode: 200,
          res,
          message: "Logged In successfully",
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const logoutUser = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req.user?._id as string) || "";
      if (userId) {
        await redis.del(userId as string);
      }
      res.cookie("accessToken", "", {
        expires: new Date(Date.now()),
        httpOnly: true,
        maxAge: 1,
      });
      res.cookie("refreshToken", "", {
        expires: new Date(Date.now()),
        httpOnly: true,
        maxAge: 1,
      });
      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
