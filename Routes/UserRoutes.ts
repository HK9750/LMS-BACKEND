import express from "express";
import {
  registerUser,
  activateUser,
  loginUser,
  logoutUser,
} from "../Controllers/UserController";
import { Authenticate } from "../middleware/Auth";

const router = express.Router();

router.post("/register", registerUser);
router.post("/activate", activateUser);
router.post("/login", loginUser);
router.post("/logout", Authenticate, logoutUser);

export default router;
