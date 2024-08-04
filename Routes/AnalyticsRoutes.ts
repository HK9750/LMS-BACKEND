import express from "express";
import { Authenticate, Authorize } from "../middleware/Auth";
import {
  getUserAnalytics,
  getCourseAnalytics,
  getOrderAnalytics,
} from "../Controllers/AnalyticsController";

const router = express.Router();

router.get(
  "/analytics/user",
  Authenticate,
  Authorize("admin"),
  getUserAnalytics
);
router.get(
  "/analytics/course",
  Authenticate,
  Authorize("admin"),
  getCourseAnalytics
);
router.get(
  "/analytics/order",
  Authenticate,
  Authorize("admin"),
  getOrderAnalytics
);

export default router;
