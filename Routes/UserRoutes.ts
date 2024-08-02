import express from "express";
import {
  registerUser,
  activateUser,
  loginUser,
  logoutUser,
  socialAuth,
  getUserById,
  updateAccessToken,
  updateAvatar,
  updatePassword,
  updateUser,
  forgotPassword,
  resetPassword,
  deleteUser,
} from "../Controllers/UserController";
import { Authenticate, Authorize } from "../middleware/Auth";

const router = express.Router();

router.post("/register", registerUser);
router.post("/activate", activateUser);
router.post("/login", loginUser);
router.post("/logout", Authenticate, logoutUser);
router.post("/social", socialAuth);
router.get("/me", Authenticate, getUserById);
router.put("/update", Authenticate, updateUser);
router.put("/update/avatar", Authenticate, updateAvatar);
router.put("/update/password", Authenticate, updatePassword);
router.put("/update/token", Authenticate, updateAccessToken);
router.post("/forgot", forgotPassword);
router.post("/reset", resetPassword);
router.delete("/delete", Authenticate, deleteUser);

export default router;
