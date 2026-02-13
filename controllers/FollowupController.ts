import { Request, Response } from "express";
import Lead from "../models/lead";
import { AuthorizedRequest } from "../types";

const parsePositiveInt = (value: unknown, fallback: number) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const getMyFollowUps = async (req: AuthorizedRequest, res: Response) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = clamp(parsePositiveInt(req.query.limit, 50), 1, 200);
    const search = String(req.query.search ?? "").trim();
    const all = String(req.query.all ?? "").toLowerCase() === "true";

    const baseQuery: Record<string, any> = {
      follow_up_date: { $exists: true, $ne: null },
      claimed_by: req.user?._id as string,
    };

    if (search) {
      baseQuery.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { booking_id: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [totalCount, myFollowups] = await Promise.all([
      Lead.countDocuments(baseQuery),
      Lead.find(baseQuery)
        .sort({ follow_up_date: 1 })
        .skip(all ? 0 : skip)
        .limit(all ? 0 : limit)
        .select({
          firstName: 1,
          lastName: 1,
          email: 1,
          phone: 1,
          status: 1,
          follow_up_date: 1,
          createdAt: 1,
          claimed_by: 1,
          departure: 1,
          arrival: 1,
          airline: 1,
          callFor: 1,
          leadType: 1,
          travelDate: 1,
          returnDate: 1,
          passengerType: 1,
          adult: 1,
          child: 1,
          infant: 1,
          payment: 1,
          quoted_amount: 1,
          booking_id: 1,
          call_logs: { $slice: -1 },
        })
        .populate("claimed_by", "name email role")
        .populate("departure", "name city code")
        .populate("arrival", "name city code")
        .populate("airline", "name iata icao")
        .populate("call_logs.added_by", "name email")
        .lean(),
    ]);

    const myFollowupsWithLateStatus = myFollowups.map((followup) => {
      const isLate = new Date(followup.follow_up_date) < new Date();
      return {
        ...followup,
        lateFollowup: isLate,
        quoted_amount: followup.quoted_amount
          ? followup.quoted_amount.total
          : null,
      };
    });

    res.status(200).json({
      message: "Successfully retrieved followups",
      followups: myFollowupsWithLateStatus,
      pagination: all
        ? {
            currentPage: 1,
            totalPages: 1,
            totalCount,
            hasNextPage: false,
            hasPrevPage: false,
            limit: totalCount,
          }
        : {
            currentPage: page,
            totalPages: Math.max(1, Math.ceil(totalCount / limit)),
            totalCount,
            hasNextPage: page * limit < totalCount,
            hasPrevPage: page > 1,
            limit,
          },
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
    const page = parsePositiveInt(req.query.page, 1);
    const limit = clamp(parsePositiveInt(req.query.limit, 50), 1, 200);
    const search = String(req.query.search ?? "").trim();
    const all = String(req.query.all ?? "").toLowerCase() === "true";

    const baseQuery: Record<string, any> = {
      follow_up_date: { $exists: true, $ne: null },
    };

    if (search) {
      baseQuery.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { booking_id: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [totalCount, totalFollowups] = await Promise.all([
      Lead.countDocuments(baseQuery),
      Lead.find(baseQuery)
        .sort({ follow_up_date: 1 })
        .skip(all ? 0 : skip)
        .limit(all ? 0 : limit)
        .select({
          firstName: 1,
          lastName: 1,
          email: 1,
          phone: 1,
          status: 1,
          follow_up_date: 1,
          createdAt: 1,
          claimed_by: 1,
          departure: 1,
          arrival: 1,
          airline: 1,
          callFor: 1,
          leadType: 1,
          travelDate: 1,
          returnDate: 1,
          passengerType: 1,
          adult: 1,
          child: 1,
          infant: 1,
          payment: 1,
          quoted_amount: 1,
          booking_id: 1,
          call_logs: { $slice: -1 },
        })
        .populate("claimed_by", "name email role")
        .populate("departure", "name city code")
        .populate("arrival", "name city code")
        .populate("airline", "name iata icao")
        .lean(),
    ]);

    const totalFollowupsWithLateStatus = totalFollowups.map((followup) => {
      const isLate = new Date(followup.follow_up_date) < new Date();
      return {
        ...followup,
        lateFollowup: isLate,
      };
    });

    res.status(200).json({
      message: "Successfully retrieved total followups count",
      totalFollowups: totalFollowupsWithLateStatus,
      pagination: all
        ? {
            currentPage: 1,
            totalPages: 1,
            totalCount,
            hasNextPage: false,
            hasPrevPage: false,
            limit: totalCount,
          }
        : {
            currentPage: page,
            totalPages: Math.max(1, Math.ceil(totalCount / limit)),
            totalCount,
            hasNextPage: page * limit < totalCount,
            hasPrevPage: page > 1,
            limit,
          },
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
