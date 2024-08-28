import { Response } from "express";
import dotenv from "dotenv";
import { IUser } from "../Models/UserModel";
import redis from "./redis";
dotenv.config();

interface iTokenOptions {
  expires: Date;
  maxAge: number;
  httpOnly: boolean;
  secure?: boolean;
  sameSite: "lax" | "strict" | "none" | undefined;
}

interface iSendToken {
  res: Response;
  user: IUser;
  statusCode: number;
  message?: string;
}

const accessTokenExpiry = parseInt(
  process.env.JWT_ACCESS_SECRET_EXPIRY || "10",
  10
);
const refreshTokenExpiry = parseInt(
  process.env.JWT_REFRESH_SECRET_EXPIRY || "7",
  10
);

export const accessTokenOptions: iTokenOptions = {
  expires: new Date(Date.now() + accessTokenExpiry * 60 * 1000),
  maxAge: accessTokenExpiry * 60 * 1000,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
};

export const refreshTokenOptions: iTokenOptions = {
  expires: new Date(Date.now() + refreshTokenExpiry * 24 * 60 * 60 * 1000),
  maxAge: refreshTokenExpiry * 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
};

export const sendToken = async ({
  user,
  statusCode,
  res,
  message,
}: iSendToken) => {
  const accessToken = await user.generateAccessToken();
  const refreshToken = await user.generateRefreshToken();

  if (typeof accessToken !== "string" || typeof refreshToken !== "string") {
    throw new Error("Generated tokens must be strings");
  }

  redis.set(user._id as string, JSON.stringify(user) as any);

  res.cookie("accessToken", accessToken, accessTokenOptions);
  res.cookie("refreshToken", refreshToken, refreshTokenOptions);

  res.status(statusCode).json({
    success: true,
    user,
    accessToken,
    message,
  });
};
