import express from "express";
import { Authenticate, Authorize } from "../middleware/Auth";
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
  getAllUsers,
} from "../Controllers/UserController";

const router = express.Router();

router.post("/register", registerUser);
router.post("/activate", activateUser);
router.post("/login", loginUser);
router.post("/logout", Authenticate, logoutUser);
router.post("/social", socialAuth);
router.get("/update/token", updateAccessToken);

router.get("/me", Authenticate, getUserById);
router.put("/update", Authenticate, updateUser);
router.put("/update-avatar", Authenticate, updateAvatar);
router.put("/update/password", Authenticate, updatePassword);

router.post("/forgot", forgotPassword);
router.post("/reset", resetPassword);

// admin Routes
router.get("/users/admin", Authenticate, Authorize("admin"), getAllUsers);
router.delete("/delete-user/:id", Authenticate, Authorize("admin"), deleteUser);

export default router;
