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
const app = express();

const options = { origin: "http://localhost:3000", credentials: true };

app.use(fileUpload());
app.use(express.json({ limit: "50mb" }));
app.use(cors(options));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes of our Application
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

  app.all("*", (req: Request, res: Response, next: NextFunction) => {
    const err = new Error("Route not found") as any;
    err.statusCode = 404;
    next(err);
  });

  const uploadedFile = req.files.file;
  console.log(uploadedFile);
  res.send("File uploaded!");
});

app.use(ErrorMiddleWare);

export default app;
