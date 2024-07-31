import { Request } from "express";
import { IUser } from "../Models/UserModel";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
