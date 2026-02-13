import { NextFunction, Request, Response } from "express";
import Refund from "../models/refund";

const parsePositiveInt = (value: unknown, fallback: number) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const addRefundRequest = async (req: Request, res: Response) => {
  try {
    const refundRequest = new Refund(req.body);
    await refundRequest.save();

    res
      .status(200)
      .json({ message: "Refund Request Added Successfully", refundRequest });
  } catch (error) {
    res.status(500).json({ message: "Can't Add Refund Request", error });
  }
};

export const getRefundRequest = async (req: Request, res: Response) => {
  try {
    const refundRequest = await Refund.findById(req.params.id);
    if (!refundRequest) {
      return res.status(404).json({ message: "Refund Request Not Found" });
    }
    res.status(200).json(refundRequest);
  } catch (error) {
    res.status(500).json({ message: "Can't Get Refund Request", error });
  }
};

export const deleteRefundRequest = async (req: Request, res: Response) => {
  try {
    const refundRequest = await Refund.findByIdAndDelete(req.params.id);
    if (!refundRequest) {
      return res.status(404).json({ message: "Refund Request Not Found" });
    }
    res.status(200).json({ message: "Refund Request Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ message: "Can't Delete Refund Request", error });
  }
};

export const editRefundRequest = async (req: Request, res: Response) => {
  try {
    const refundRequest = await Refund.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!refundRequest) {
      return res.status(404).json({ message: "Refund Request Not Found" });
    }
    res.status(200).json(refundRequest);
  } catch (error) {
    res.status(500).json({ message: "Can't Edit Refund Request", error });
  }
};

export const getRefundRequests = async (req: Request, res: Response) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = clamp(parsePositiveInt(req.query.limit, 50), 1, 200);
    const all = String(req.query.all ?? "").toLowerCase() === "true";
    const search = String(req.query.search ?? "").trim();

    const query: Record<string, any> = {};
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
        { surname: { $regex: search, $options: "i" } },
        { mobileNumber: { $regex: search, $options: "i" } },
        { ticketNumber: { $regex: search, $options: "i" } },
        { pnrNumber: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [totalCount, refundRequests] = await Promise.all([
      Refund.countDocuments(query),
      Refund.find(query)
        .sort({ createdAt: -1 })
        .skip(all ? 0 : skip)
        .limit(all ? 0 : limit)
        .lean(),
    ]);

    res.status(200).json({
      message: "Refund requests retrieved successfully",
      refunds: refundRequests,
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
    res.status(500).json({ message: "Can't Get Refund Requests", error });
  }
};
