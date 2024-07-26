import { Response } from "express";
import jwt from "jsonwebtoken";
import { IUser } from "../models/user";

export const sendJwt = (
  user: IUser,
  res: Response,
  type: "login" | "signup",
  message?: string
) => {
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET as string);
  res.status(type === "signup" ? 201 : 200).json({
    success: true,
    token,
    message,
  });
};
