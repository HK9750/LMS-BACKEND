import jwt from "jsonwebtoken";
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

export const sendToken = ({ user, statusCode, res, message }: iSendToken) => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  redis.set(user._id as string, JSON.stringify(user) as any);

  const accessTokenExpiry = parseInt(
    process.env.JWT_ACCESS_SECRET_EXPIRY || "300",
    10
  );
  const refreshTokenExpiry = parseInt(
    process.env.JWT_REFRESH_SECRET_EXPIRY || "1200",
    10
  );

  const accessTokenOptions: iTokenOptions = {
    expires: new Date(Date.now() + accessTokenExpiry * 1000),
    maxAge: accessTokenExpiry * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };

  const refreshTokenOptions: iTokenOptions = {
    expires: new Date(Date.now() + refreshTokenExpiry * 1000),
    maxAge: refreshTokenExpiry * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };

  res.cookie("accessToken", accessToken, accessTokenOptions);
  res.cookie("refreshToken", refreshToken, refreshTokenOptions);

  res.status(statusCode).json({
    success: true,
    user,
    accessToken,
    message,
  });
};
