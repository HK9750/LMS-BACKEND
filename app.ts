import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import ErrorMiddleWare from "./middleware/Error";
import UserRoutes from "./Routes/UserRoutes";
import CourseRoutes from "./Routes/CourseRoutes";
import NotificationRoutes from "./Routes/NotificationRoutes";
import OrderRoutes from "./Routes/OrderRoutes";
import LayoutRoutes from "./Routes/LayoutRoutes";
import AnalyticsRoutes from "./Routes/AnalyticsRoutes";
import fileUpload from "express-fileupload";
import { rateLimit } from "express-rate-limit";
import dotenv from "dotenv";
const app = express();
dotenv.config();

console.log(process.env.FRONTEND_URL);
const options = { origin: [process.env.FRONTEND_URL], credentials: true };

app.use(fileUpload());
app.use(express.json({ limit: "50mb" }));
app.use(cors(options as any));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

app.use("/api/v1", UserRoutes);
app.use("/api/v1", CourseRoutes);
app.use("/api/v1", NotificationRoutes);
app.use("/api/v1", OrderRoutes);
app.use("/api/v1", LayoutRoutes);
app.use("/api/v1", AnalyticsRoutes);

app.get("/test", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    message: "API is working!",
    success: true,
  });
});
app.post("/test-upload", (req: Request, res: Response) => {
  console.log(req.files);
  if (!req.files || !req.files.file) {
    return res.status(400).send("No file uploaded.");
  }
  const uploadedFile = req.files.file;
  console.log(uploadedFile);
  res.send("File uploaded!");
});

app.all("*", (req: Request, res: Response, next: NextFunction) => {
  const err = new Error("Route not found") as any;
  err.statusCode = 404;
  next(err);
});

app.use(limiter);
app.use(ErrorMiddleWare);

export default app;
