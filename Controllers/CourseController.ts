import CourseModel from "../Models/CourseModel";
import { Request, Response, NextFunction } from "express";
import AsyncErrorHandler from "../utils/AsyncErrorHandler";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import redis from "../utils/redis";
import mongoose from "mongoose";
import ejs from "ejs";
import path from "path";
import { sendMail } from "../utils/sendMail";
import NotificationModel from "../Models/NotificationModel";

interface iQuestionBody {
  question: string;
  courseId: string;
  contentId: string;
}

interface iAnswerBody {
  answer: string;
  courseId: string;
  contentId: string;
  questionId: string;
}

interface iReviewBody {
  rating: number;
  review: string;
}

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
          course,
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
        const courses = JSON.parse(coursesCache);
        console.log("Through redis");
        res.status(200).json({
          success: true,
          courses,
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

export const addQuestion = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question, courseId, contentId } = req.body as iQuestionBody;
      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }
      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Content id is not correct", 400));
      }
      const content = course.courseData.find(
        (content: any) => content._id.toString() === contentId
      );
      if (!content) {
        return next(new ErrorHandler("Content not found", 404));
      }
      const newQuestion: any = {
        user: req.user,
        question,
        questionReplies: [],
      };
      content.questions.push(newQuestion);
      await course.save();
      await redis.del(courseId);
      await NotificationModel.create({
        userId: req.user?._id,
        title: "New Question",
        message: `A new question has been asked in your course:${content.title}`,
      });
      res.status(200).json({
        success: true,
        message: "Question added successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const addAnswerToQuestion = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { answer, courseId, contentId, questionId } =
        req.body as iAnswerBody;
      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }
      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Content id is not correct", 400));
      }
      const content = course.courseData.find(
        (content: any) => content._id.toString() === contentId
      );
      if (!content) {
        return next(new ErrorHandler("Content not found", 404));
      }
      const question = content.questions.find(
        (question: any) => question._id.toString() === questionId
      );
      if (!question) {
        return next(new ErrorHandler("Question not found", 404));
      }
      const newAnswer: any = {
        user: req.user,
        comment: answer,
        commentReplies: [],
      };
      question.commentReplies?.push(newAnswer);
      await course.save();
      await redis.del(courseId);
      const data = {
        name: question.user.name,
        title: content.title,
        message: `Your question has been answered by ${req.user?.name}`,
      };
      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/questionReply.ejs"),
        data
      );
      try {
        await sendMail({
          to: question.user.email,
          subject: "Question Reply",
          template: "questionReply.ejs",
          data,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
      res.status(200).json({
        success: true,
        message: "Answer added successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const addReview = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { rating, review } = req.body as iReviewBody;
      const courses = req.user?.courses;
      const courseId = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return next(new ErrorHandler("Course id is not valid", 400));
      }
      const isCourseExists = courses?.find(
        (course: any) => course._id.toString() === courseId.toString()
      );
      if (!isCourseExists) {
        return next(new ErrorHandler("Course not found", 404));
      }
      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }
      const newReview: any = {
        user: req.user,
        rating: Number(rating),
        comment: review,
        commentReplies: [],
      };
      course.reviews.push(newReview);
      course.ratings =
        course.reviews.reduce(
          (acc: number, item: any) => item.rating + acc,
          0
        ) / course.reviews.length;
      await course.save();
      await redis.del(courseId);
      // Create notification that A review has been added to the course
      await NotificationModel.create({
        userId: req.user?._id,
        title: "New Review",
        message: `A new review has been added to your course:${course.name}`,
      });
      res.status(200).json({
        success: true,
        message: "Review added successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const replyToTheReview = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { answer, courseId, reviewId } = req.body;
      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }
      const review = course.reviews.find(
        (review: any) => review._id.toString() === reviewId
      );
      if (!review) {
        return next(new ErrorHandler("Review not found", 404));
      }
      const newAnswer: any = {
        user: req.user,
        comment: answer,
        commentReplies: [],
      };
      review.commentReplies?.push(newAnswer);
      await course.save();
      await redis.del(courseId);

      const data = {
        name: review.user.name,
        message: `Your review has been replied to by ${req.user?.name}`,
      };
      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/ReviewReply.ejs"),
        data
      );
      try {
        await sendMail({
          to: review.user.email,
          subject: "Review Reply",
          template: "ReviewReply.ejs",
          data,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
      res.status(200).json({
        success: true,
        message: "Answer added successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getAllCoursesAdmin = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courses = await CourseModel.find().sort({ createdAt: -1 });
      if (!courses) {
        return next(new ErrorHandler("No courses found", 404));
      }
      res.status(200).json({
        success: true,
        courses,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const deleteCourse = AsyncErrorHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }
      await cloudinary.v2.uploader.destroy(course.thumbnail?.public_id);
      await CourseModel.findByIdAndDelete(courseId);
      await redis.del(courseId);
      res.status(200).json({
        success: true,
        message: "Course deleted successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
