import { NextFunction, Request, Response } from "express";

import User from "../models/user";
import Lead from "../models/lead";

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await User.find();

    const usersWithLeads = await Promise.all(
      users.map(async (user) => {
        const leads = await Lead.find({
          claimed_by: user._id,
          converted: false,
        });

        return {
          ...user.toObject(),
          leadsInProgress: leads.length,
        };
      })
    );

    res.status(200).json({
      status: "success",
      users: usersWithLeads,
    });
  } catch (error: any) {
    next(error);
  }
};
