import { Request, Response } from "express";

import Lead from "../models/lead";
import { sendTicketConfirmationEmail } from "../services";
import { AuthorizedRequest } from "../types";

export const addLead = async (req: AuthorizedRequest, res: Response) => {
  try {
    const leadDataFromBody = req.body;

    let leadData = { ...leadDataFromBody };

    if (req.user?.role === "agent") {
      leadData = { ...leadData, claimed_by: req.user._id };
    }

    const newLead = new Lead(leadData);
    await newLead.save();

    res
      .status(200)
      .json({ message: "Lead submitted successfully", lead: newLead });
  } catch (error) {
    res.status(500).json({ message: "Failed to submit lead", error });
  }
};

export const editLead = async (req: Request, res: Response) => {
  try {
    const leadId = req.params.id;
    const leadData = req.body;

    const updatedLead = await Lead.findByIdAndUpdate(leadId, leadData, {
      new: true,
    });

    if (!updatedLead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res
      .status(200)
      .json({ message: "Lead updated successfully", data: updatedLead });
  } catch (error) {
    res.status(500).json({ message: "Failed to update lead", error });
  }
};

export const addCallLog = async (req: Request, res: Response) => {
  try {
    const leadId = req.body.leadId;
    const callLogData = req.body;

    const lead = await Lead.findById(leadId);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    lead.call_logs.push({ ...callLogData, leadId: null });
    await lead.save();

    res.status(200).json({
      message: "Call log added successfully",
      data: lead.call_logs[lead.call_logs.length - 1],
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to add call log", error });
  }
};

export const sendPnrConfirmationEmail = async (req: Request, res: Response) => {
  try {
    const leadId = req.params.leadId;
    const { pnr } = req.body;

    // Fetch lead details
    const lead = await Lead.findById(leadId).populate("departure arrival");

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    if (!lead.departure || !lead.arrival) {
      res.status(500).json({
        message: "Please Add The Departure and Arrival Airport In The Lead",
      });
    }

    // TODO: Implement email sending logic here
    sendTicketConfirmationEmail(lead.email, pnr, lead.passenger_name, {
      departureCity: lead.departure.city,
      arrivalCity: lead.arrival.city,
      departureDate: lead.travelDate,
    });
    lead.pnr = pnr;
    await lead.save();

    res
      .status(200)
      .json({ message: "PNR confirmation email sent successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to send PNR confirmation email", error });
  }
};

export const deleteLead = async (req: Request, res: Response) => {
  try {
    const leadId = req.params.id;

    const deletedLead = await Lead.findByIdAndDelete(leadId);

    if (!deletedLead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res
      .status(200)
      .json({ message: "Lead deleted successfully", data: deletedLead });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete lead", error });
  }
};

export const getAllLeads = async (req: Request, res: Response) => {
  try {
    const leads = await Lead.find()
      .sort({ createdAt: -1 }) // Sort by createdAt field in descending order
      .populate("claimed_by departure arrival");

    res.status(200).json({ message: "Successfully retrieved leads", leads });
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve leads", error });
  }
};

export const getLeadById = async (req: Request, res: Response) => {
  try {
    const leadId = req.params.id;

    const lead = await Lead.findById(leadId).populate(
      "claimed_by departure arrival"
    );

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res.status(200).json({ message: "Successfully retrieved lead", lead });
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve lead", error });
  }
};

export const getLeadsByUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;

    const leads = await Lead.find({ claimed_by: userId })
      .sort({ createdAt: -1 }) // Sort by createdAt field in descending order
      .populate("departure arrival claimed_by");

    res.status(200).json({ message: "Successfully retrieved leads", leads });
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve leads", error });
  }
};
