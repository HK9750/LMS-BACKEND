import express from "express";
import { Authenticate, Authorize } from "../middleware/Auth";

import {
  getAllNotifications,
  updateNotification,
} from "../Controllers/NotificationController";

const router = express.Router();

router.get(
  "/notifications",
  Authenticate,
  Authorize("admin"),
  getAllNotifications
);

router.put(
  "/notification/update/:id",
  Authenticate,
  Authorize("admin"),
  updateNotification
);

export default router;
