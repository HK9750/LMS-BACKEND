import express from "express";
import { Authenticate, Authorize } from "../middleware/Auth";

import {
  getLayout,
  editLayout,
  createLayout,
} from "../Controllers/LayoutController";

const router = express.Router();

router.get("/layout", Authenticate, getLayout);

router.put("/layout/edit", Authenticate, Authorize("admin"), editLayout);

router.post("/layout/create", Authenticate, Authorize("admin"), createLayout);

export default router;
