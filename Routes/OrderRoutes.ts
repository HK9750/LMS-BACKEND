import express from "express";
import { Authenticate, Authorize } from "../middleware/Auth";

import { createOrder, getAllOrders } from "../Controllers/OrderController";

const router = express.Router();

router.post("/order/create", Authenticate, createOrder);

router.get("/orders", Authenticate, Authorize("admin"), getAllOrders);

export default router;
