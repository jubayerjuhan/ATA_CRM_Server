import { Request, Response } from "express";

import Lead from "../models/lead";
import { sendTicketConfirmationEmail } from "../services";
import { AuthorizedRequest } from "../types";

export const getAllCustomers = async (
  req: AuthorizedRequest,
  res: Response
) => {
  try {
    const customers = await Lead.find({
      claimed_by: { $exists: true },
    }).populate("claimed_by departure arrival");
    const customersCount = customers.length;

    res.status(200).json({
      message: "Customers Retrived Successfully",
      customers,
      customersCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to retrive customers", error });
  }
};

// Add splitted quoted amount here
export const addQuotedAmount = async (req: Request, res: Response) => {
  try {
    console.log(req.body);
    const { quotedAmount } = req.body;

    if (!quotedAmount) {
      return res.status(400).json({ message: "Quoted amount is required" });
    }

    const leadId = req.params.id;

    const lead = await Lead.findById(leadId);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    lead.quoted_amount = quotedAmount;
    await lead.save();

    res.status(200).json({ message: "Quoted amount added successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to add quoted amount", error });
  }
};
