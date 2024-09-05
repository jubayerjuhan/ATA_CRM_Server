import { IUser } from "./../models/user";
// middlewares/roleChecker.ts

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import User from "../models/user";
import { AuthorizedRequest } from "../types";

interface JwtPayload {
  _id: string;
}

export const checkRole = (allowedRoles: string[]) => {
  return async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }

      console.log(process.env.JWT_SECRET, "kjsjs");

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JwtPayload;

      const userId = decoded._id;

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!allowedRoles.includes(user.role)) {
        return res
          .status(403)
          .json({ message: "Access denied. Insufficient permissions." });
      }

      req.user = user;

      next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }
  };
};
