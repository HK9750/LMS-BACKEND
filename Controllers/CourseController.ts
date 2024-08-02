import CourseModel from "../Models/CourseModel";
import { Request, Response, NextFunction } from "express";
import AsyncErrorHandler from "../utils/AsyncErrorHandler";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import redis from "../utils/redis";
import mongoose from "mongoose";

export const createCourse = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;
      if (!thumbnail) {
        return next(
          new ErrorHandler("Please upload thumbnail of the course", 400)
        );
      }
      const cloudThumbnail = await cloudinary.v2.uploader.upload(thumbnail, {
        folder: "courseslms",
        width: 150,
        height: 150,
      });
      data.thumbnail = {
        public_id: cloudThumbnail.public_id,
        url: cloudThumbnail.secure_url,
      };
      try {
        const course = await CourseModel.create(data);
        await redis.del("courses");
        await redis.set(course._id as string, JSON.stringify(course));
        res.status(201).json({
          success: true,
          course,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const editCourse = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const data = req.body;
      if (data.thumbnail) {
        const course = await CourseModel.findById(courseId);
        if (!course) {
          return next(new ErrorHandler("Course not found", 404));
        }
        await cloudinary.v2.uploader.destroy(course.thumbnail?.public_id);
        const cloudThumbnail = await cloudinary.v2.uploader.upload(
          data.thumbnail,
          {
            folder: "courseslms",
            width: 150,
            height: 150,
          }
        );
        data.thumbnail = {
          public_id: cloudThumbnail.public_id,
          url: cloudThumbnail.secure_url,
        };
      }
      const course = await CourseModel.findByIdAndUpdate(
        courseId,
        { $set: data },
        {
          new: true,
          runValidators: true,
        }
      );
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }
      await redis.del("courses");
      await redis.set(course._id as string, JSON.stringify(course));
      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getSingleCourse = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const courseCache = await redis.get(courseId);
      if (courseCache) {
        const course = JSON.parse(courseCache);
        console.log("Through redis");
        return res.status(200).json({
          success: true,
          course: JSON.parse(course),
        });
      } else {
        const course = await CourseModel.findById(courseId).select(
          "-courseData.videoUrl -courseData.questions -courseData.links -courseData.suggestion"
        );
        if (!course) {
          return next(new ErrorHandler("Course not found", 404));
        }
        await redis.set(course._id as string, JSON.stringify(course));
        console.log("Through mongodb");
        res.status(200).json({
          success: true,
          course,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getAllCourses = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const coursesCache = await redis.get("courses");
      if (coursesCache) {
        const courses = JSON.stringify(coursesCache);
        console.log("Through redis");
        res.status(200).json({
          success: true,
          courses: JSON.parse(courses),
        });
      } else {
        const courses = await CourseModel.find().select(
          "-courseData.videoUrl -courseData.questions -courseData.links -courseData.suggestion"
        );
        if (!courses) {
          return next(new ErrorHandler("No courses found", 404));
        }
        await redis.set("courses", JSON.stringify(courses));
        console.log("Through mongodb");
        res.status(200).json({
          success: true,
          courses,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getCourseByUser = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourses = req.user?.courses;
      if (!userCourses) {
        return next(new ErrorHandler("No courses found for the User", 404));
      }
      const courseId = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return next(new ErrorHandler("Course id is required", 400));
      }
      const isCourseExist = userCourses?.find(
        (course: any) => course?._id.toString() === courseId.toString()
      );
      if (!isCourseExist) {
        return next(new ErrorHandler("Course not found", 404));
      }
      const course = await CourseModel.findById(courseId);
      const courseContent = course?.courseData;
      res.status(200).json({
        success: true,
        content: courseContent,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
