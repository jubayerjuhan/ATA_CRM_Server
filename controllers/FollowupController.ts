import { Request, Response } from "express";
import Lead from "../models/lead";
import { AuthorizedRequest } from "../types";

export const getMyFollowUps = async (req: AuthorizedRequest, res: Response) => {
  try {
    const myFollowups = await Lead.find({
      follow_up_date: { $exists: true },
      claimed_by: req.user?._id as string,
    });
    res.status(200).json({
      message: "Successfully retrieved followups",
      followups: myFollowups,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve followups", error });
  }
};
