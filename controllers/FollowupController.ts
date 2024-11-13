import { Request, Response } from "express";
import Lead from "../models/lead";
import { AuthorizedRequest } from "../types";

export const getMyFollowUps = async (req: AuthorizedRequest, res: Response) => {
  try {
    const myFollowups = await Lead.find({
      follow_up_date: { $exists: true, $ne: null },
      claimed_by: req.user?._id as string,
    }).populate("claimed_by departure arrival airline call_logs.added_by");

    const myFollowupsWithLateStatus = myFollowups.map((followup) => {
      const isLate = new Date(followup.follow_up_date) < new Date();
      return {
        ...followup.toObject(),
        lateFollowup: isLate,
        quoted_amount: followup.quoted_amount
          ? followup.quoted_amount.total
          : null,
      };
    });
    console.log(myFollowupsWithLateStatus, "hello");

    res.status(200).json({
      message: "Successfully retrieved followups",
      followups: myFollowupsWithLateStatus,
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
      follow_up_date: { $exists: true, $ne: null },
    }).populate("claimed_by departure arrival airline");

    const totalFollowupsWithLateStatus = totalFollowups.map((followup) => {
      const isLate = new Date(followup.follow_up_date) < new Date();
      return {
        ...followup.toObject(),
        lateFollowup: isLate,
      };
    });

    res.status(200).json({
      message: "Successfully retrieved total followups count",
      totalFollowups: totalFollowupsWithLateStatus,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to retrieve total followups count", error });
  }
};

export const deleteFollowUp = async (req: AuthorizedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const followup = await Lead.findByIdAndUpdate(id, {
      follow_up_date: null,
    });

    if (!followup) {
      return res.status(404).json({ message: "Followup not found" });
    }

    res.status(200).json({ message: "Successfully deleted followup" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete followup", error });
  }
};
