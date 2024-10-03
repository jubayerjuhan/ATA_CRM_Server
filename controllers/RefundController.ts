import { NextFunction, Request, Response } from "express";
import Refund from "../models/refund";

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
    const refundRequests = await Refund.find();
    res.status(200).json(refundRequests);
  } catch (error) {
    res.status(500).json({ message: "Can't Get Refund Requests", error });
  }
};
