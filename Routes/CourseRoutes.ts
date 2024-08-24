import express from "express";
import { Authenticate, Authorize } from "../middleware/Auth";
import {
  createCourse,
  editCourse,
  getAllCourses,
  getSingleCourse,
  addReview,
  addAnswerToQuestion,
  addQuestion,
  replyToTheReview,
  getAllCoursesAdmin,
  deleteCourse,
  getCourseByUser,
  getTopCourseReviews,
  searchCourses,
} from "../Controllers/CourseController";

const router = express.Router();

router.get("/courses", getAllCourses);
router.get("/course/:id", getSingleCourse);
router.put("/course/review/:id", Authenticate, addReview);
router.put("/course/question", Authenticate, addQuestion);
router.put("/course/answer/:id", Authenticate, addAnswerToQuestion);

router.get("/courses/user/:id", Authenticate, getCourseByUser);
router.get("/courses/reviews", getTopCourseReviews);
router.get("/courses/search/name", searchCourses);

// Admin routes
router.put("/course/edit/:id", Authenticate, Authorize("admin"), editCourse);
router.post("/course/create", Authenticate, Authorize("admin"), createCourse);
router.put(
  "/course/review/reply/:id",
  Authenticate,
  Authorize("admin"),
  replyToTheReview
);
router.get(
  "/courses/admin",
  Authenticate,
  Authorize("admin"),
  getAllCoursesAdmin
);
router.delete(
  "/course/delete/:id",
  Authenticate,
  Authorize("admin"),
  deleteCourse
);

export default router;
