import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import ErrorMiddleWare from "./middleware/Error";
import UserRoutes from "./Routes/UserRoutes";
const app = express();

const options = { origin: "http://localhost:3000", credentials: true };

app.use(express.json({ limit: "50mb" }));
app.use(cors(options));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes of our Application
app.use("/api/v1", UserRoutes);

app.get("/test", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    message: "API is working!",
    success: true,
  });
});

app.all("*", (req: Request, res: Response, next: NextFunction) => {
  const err = new Error("Route not found") as any;
  err.statusCode = 404;
  next(err);
});

app.use(ErrorMiddleWare);

export default app;
