import express from "express";
import { Authenticate, Authorize } from "../middleware/Auth";

import {
  createOrder,
  getAllOrders,
  sendStripePublishableKey,
  newPayment,
} from "../Controllers/OrderController";

const router = express.Router();

router.post("/order/create", Authenticate, createOrder);

router.get("/orders", Authenticate, Authorize("admin"), getAllOrders);

router.get("/stripeapi", sendStripePublishableKey);

router.post("/stripepayment", Authenticate, newPayment);

export default router;
