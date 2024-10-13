import { NextFunction, Request, Response } from "express";

import User from "../models/user";
import Lead from "../models/lead";
import { AuthorizedRequest } from "../types";
import moment from "moment";

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

export const getUsersOverview = async (
  req: AuthorizedRequest,
  res: Response
) => {
  const { startDate, endDate } = req.query;

  // Check if both startDate and endDate are provided
  if (!startDate || !endDate) {
    return res
      .status(400)
      .json({ message: "Please provide both startDate and endDate" });
  }

  try {
    // Parse startDate and endDate using moment to ensure valid date objects
    const start = moment(startDate as string, moment.ISO_8601, true).startOf(
      "day"
    );
    const end = moment(endDate as string, moment.ISO_8601, true).endOf("day");

    if (!start.isValid() || !end.isValid()) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    // Fetch all users
    const users = await User.find();

    // Prepare the result array
    const result = await Promise.all(
      users.map(async (user) => {
        // Fetch leads for the user within the date range
        const userLeads = await Lead.find({
          createdAt: {
            $gte: start.toDate(),
            $lte: end.toDate(),
          },
          claimed_by: user._id,
        });

        // Fetch converted leads for the user within the date range
        const convertedLeads = await Lead.find({
          createdAt: {
            $gte: start.toDate(),
            $lte: end.toDate(),
          },
          claimed_by: user._id,
          converted: true,
        });

        // Calculate conversion rate
        const conversionRate =
          userLeads.length > 0
            ? (convertedLeads.length / userLeads.length) * 100
            : 0;

        return {
          user: user.toObject(),
          leadsInProgress: userLeads.length,
          convertedLeads: convertedLeads.length,
          conversionRate: conversionRate.toFixed(2) + "%",
        };
      })
    );

    // Return the result
    res.send(result);
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ message: "Server error" });
  }
};
