import { Request, Response } from "express";
import Lead from "../models/lead";
import { AuthorizedRequest } from "../types";

export const getMyFollowUps = async (req: AuthorizedRequest, res: Response) => {
  try {
    const myFollowups = await Lead.find({
      follow_up_date: { $exists: true, $gte: new Date() },
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

export const getTotalFollowUps = async (
  req: AuthorizedRequest,
  res: Response
) => {
  try {
    const totalFollowups = await Lead.find({
      follow_up_date: { $exists: true, $gte: new Date() },
    }).populate("claimed_by departure arrival airline");

    res.status(200).json({
      message: "Successfully retrieved total followups count",
      totalFollowups,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to retrieve total followups count", error });
  }
};
