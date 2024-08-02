import express from "express";
import { Authenticate, Authorize } from "../middleware/Auth";
import {
  createCourse,
  editCourse,
  getAllCourses,
  getSingleCourse,
} from "../Controllers/CourseController";

const router = express.Router();

router.post("/course/create", Authenticate, Authorize("admin"), createCourse);
router.put("/course/edit/:id", Authenticate, Authorize("admin"), editCourse);
router.get("/courses", getAllCourses);
router.get("/course/:id", getSingleCourse);

export default router;
