import ErrorHandler from "../utils/ErrorHandler";
import AsyncErrorHandler from "../utils/AsyncErrorHandler";
import { Request, Response, NextFunction } from "express";
import UserModel, { IUser } from "../Models/UserModel";
import jwt from "jsonwebtoken";
import redis from "../utils/redis";
import { sendMail } from "../utils/sendMail";
import cloudinary from "cloudinary";
import {
  accessTokenOptions,
  refreshTokenOptions,
  sendToken,
} from "../utils/jwtTokens";
import fs from "fs";
import path from "path";
import fileUpload from "express-fileupload";

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

interface iSocialAuthBody {
  name: string;
  email: string;
  avatar: string;
}

interface iUpdateUserBody {
  name?: string;
  email?: string;
  avatar?: string;
}

interface iUpdateAvatarBody {
  avatar: string;
}

interface iUpdatePasswordBody {
  oldPassword: string;
  newPassword: string;
}

interface iForgotPasswordBody {
  email: string;
}

interface iResetPasswordBody {
  resetToken: string;
  newPassword: string;
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
      const user = await UserModel.create({
        name,
        email,
        password,
        avatar: {
          public_id: "",
          url: "",
        },
      });
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
      });
      res.cookie("refreshToken", "", {
        expires: new Date(Date.now()),
        httpOnly: true,
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

export const updateAccessToken = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return next(new ErrorHandler("Please login to access this route", 401));
      }
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET as string
      ) as { id: string };
      if (!decoded) {
        return next(new ErrorHandler("Invalid token", 401));
      }
      const user = await redis.get(decoded.id);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }
      const parsedUser = JSON.parse(user as string);
      const accessToken = jwt.sign(
        parsedUser,
        process.env.JWT_ACCESS_SECRET as string,
        { expiresIn: "5m" }
      );
      const newRefreshToken = jwt.sign(
        parsedUser,
        process.env.JWT_REFRESH_SECRET as string,
        { expiresIn: "7d" }
      );
      res.cookie("accessToken", accessToken, accessTokenOptions);
      res.cookie("refreshToken", newRefreshToken, refreshTokenOptions);
      res.status(200).json({
        success: true,
        message: "Access token updated successfully",
        accessToken,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const socialAuth = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, avatar } = req.body as iSocialAuthBody;
      const user = await UserModel.findOne({ email });
      if (user) {
        sendToken({
          user,
          statusCode: 200,
          res,
          message: "Logged In successfully",
        });
      } else {
        const newUser = await UserModel.create({ name, email, avatar });
        sendToken({
          user: newUser,
          statusCode: 201,
          res,
          message: "Account created and logged in successfully",
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getUserById = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const user = await UserModel.findById(userId);
      res.status(200).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const updateUser = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email } = req.body as iUpdateUserBody;
      const userId = req.user?._id;
      const user = await UserModel.findById(userId);
      if (name && user) {
        user.name = name;
      }
      if (email && user) {
        const isEmailExists = await UserModel.findOne({ email });
        if (isEmailExists) {
          return next(new ErrorHandler("Email already exists", 400));
        }
        user.email = email;
      }
      await user?.save();
      await redis.set(userId as string, JSON.stringify(user));
      res.status(200).json({
        success: true,
        message: "User updated successfully",
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const updateAvatar = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.files || !req.files.avatar) {
        return next(new ErrorHandler("No file uploaded", 400));
      }

      const file = req.files.avatar as fileUpload.UploadedFile;
      const userId = req.user?._id;

      if (!userId) {
        return next(new ErrorHandler("User not found", 404));
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      const tempFilePath = path.join(__dirname, "../temp", file.name);

      await new Promise<void>((resolve, reject) => {
        file.mv(tempFilePath, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });

      if (user.avatar?.public_id) {
        try {
          await cloudinary.v2.uploader.destroy(user.avatar.public_id);
        } catch (cloudinaryError) {
          console.error("Cloudinary destroy error:", cloudinaryError);
          fs.unlinkSync(tempFilePath);
          return next(new ErrorHandler("Error deleting old avatar", 500));
        }
      }

      let myCloudAvatar;
      try {
        myCloudAvatar = await cloudinary.v2.uploader.upload(tempFilePath, {
          folder: "avatarslms",
          width: 200,
          height: 200,
        });
      } catch (cloudinaryError) {
        console.error("Cloudinary upload error:", cloudinaryError);
        fs.unlinkSync(tempFilePath);
        return next(new ErrorHandler("Error uploading new avatar", 500));
      }

      fs.unlinkSync(tempFilePath);

      user.avatar = {
        public_id: myCloudAvatar.public_id,
        url: myCloudAvatar.secure_url,
      };

      const newUser = await user.save();

      try {
        await redis.set(userId.toString(), JSON.stringify(newUser));
      } catch (redisError) {
        console.error("Redis set error:", redisError);
        return next(new ErrorHandler("Error updating cache", 500));
      }

      res.status(200).json({
        success: true,
        message: "Avatar updated successfully",
        user: newUser,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const updatePassword = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { newPassword, oldPassword } = req.body as iUpdatePasswordBody;
      const userId = req.user?._id;
      const user = await UserModel.findById(userId).select("+password");
      if (user?.password === undefined) {
        return next(new ErrorHandler("Invalid User", 404));
      }
      if (!newPassword || !oldPassword) {
        return next(
          new ErrorHandler("Please provide old and new password", 400)
        );
      }
      const isPasswordMatch = await user?.comparePassword(oldPassword);
      if (!isPasswordMatch) {
        return next(new ErrorHandler("Invalid password", 400));
      }
      user.password = newPassword;
      await user?.save();
      await redis.set(userId as string, JSON.stringify(user));
      res.status(200).json({
        success: true,
        message: "Password updated successfully",
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const deleteUser = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      await UserModel.findByIdAndDelete(userId);
      await redis.del(userId as string);
      res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const forgotPassword = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body as iForgotPasswordBody;
      const user = await UserModel.findOne({ email });
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }
      const resetToken = jwt.sign(
        { id: user._id },
        process.env.RESET_SECRET as string,
        { expiresIn: "10m" }
      );
      try {
        await sendMail({
          to: email,
          subject: "Password Reset",
          template: "PasswordReset.ejs",
          data: { user: user.name, resetToken },
        });
        res.status(200).json({
          success: true,
          message: `Password reset email sent successfully to ${email}`,
          resetToken,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const resetPassword = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { resetToken, newPassword } = req.body as iResetPasswordBody;
      if (!resetToken || !newPassword) {
        return next(
          new ErrorHandler("Please provide reset token and password", 400)
        );
      }
      const decoded = jwt.verify(
        resetToken,
        process.env.RESET_SECRET as string
      ) as { id: string };
      if (!decoded) {
        return next(new ErrorHandler("Invalid token", 400));
      }
      const user = await UserModel.findById(decoded.id);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }
      user.password = newPassword;
      await user.save();
      await redis.set(decoded.id, JSON.stringify(user));
      res.status(200).json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
