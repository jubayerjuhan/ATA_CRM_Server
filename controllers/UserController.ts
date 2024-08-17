import { NextFunction, Request, Response } from "express";

import User from "../models/user";

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await User.find();
    console.log(users, "user....");

    res.status(200).json({
      status: "success",
      users,
    });
  } catch (error: any) {
    next(error);
  }
};
