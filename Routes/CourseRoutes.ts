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
} from "../Controllers/CourseController";

const router = express.Router();

router.post("/course/create", Authenticate, Authorize("admin"), createCourse);
router.put("/course/edit/:id", Authenticate, Authorize("admin"), editCourse);
router.get("/courses", getAllCourses);
router.get("/course/:id", getSingleCourse);
router.put("/course/review/:id", Authenticate, addReview);
router.put("/course/question/:id", Authenticate, addQuestion);
router.put("/course/answer/:id", Authenticate, addAnswerToQuestion);
router.put(
  "/course/review/reply/:id",
  Authenticate,
  Authorize("admin"),
  replyToTheReview
);

export default router;
