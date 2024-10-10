import { Request, Response } from "express";

import Lead from "../models/lead";
import { sendTicketConfirmationEmail } from "../services";
import { AuthorizedRequest } from "../types";

// Function to generate a unique booking ID
const generateBookingId = async (): Promise<string> => {
  const lastLead = await Lead.findOne({})
    .sort({ createdAt: -1 }) // Get the last lead by creation date
    .select("booking_id")
    .exec();

  let lastNumber = 1000; // Default starting point

  if (lastLead && lastLead.booking_id) {
    const lastBookingId = lastLead.booking_id;
    const lastDigits = lastBookingId.replace("AT", ""); // Extract numeric part
    lastNumber = parseInt(lastDigits, 10) + 1; // Increment the number
  }

  return `AT${lastNumber}`;
};

export const addLead = async (req: AuthorizedRequest, res: Response) => {
  try {
    const booking_id = await generateBookingId();

    const leadDataFromBody = req.body;

    let leadData = { ...leadDataFromBody, caseDate: new Date(), booking_id };

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

export const claimLead = async (req: any, res: Response) => {
  try {
    const leadId = req.params.id;
    const updatedLead = await Lead.findByIdAndUpdate(
      leadId,
      { claimed_by: req.user._id },
      { new: true }
    );

    if (!updatedLead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    res.status(200).json({ message: "Lead updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update lead" });
  }
};

export const assignLead = async (req: any, res: Response) => {
  try {
    const leadId = req.params.id;
    const { userId } = req.body;

    console.log(leadId, userId, "leadId, userId");
    const updatedLead = await Lead.findByIdAndUpdate(
      leadId,
      { claimed_by: userId },
      { new: true }
    );

    if (!updatedLead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    res.status(200).json({ message: "Lead Assigned" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to Assign lead" });
  }
};

export const addCallLog = async (req: AuthorizedRequest, res: Response) => {
  try {
    const leadId = req.body.leadId;
    const callLogData = req.body;

    const lead = await Lead.findById(leadId);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    lead.call_logs.push({
      ...callLogData,
      added_by: req.user?.id,
      leadId: null,
    });
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
    const lead = await Lead.findById(leadId).populate(
      "departure arrival airline"
    );

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    if (!lead.departure || !lead.arrival) {
      res.status(500).json({
        message: "Please Add The Departure and Arrival Airport In The Lead",
      });
    }

    // TODO: Implement email sending logic here
    sendTicketConfirmationEmail(lead.email, pnr, lead.firstName, {
      departureCity: lead.departure.city,
      arrivalCity: lead.arrival.city,
      departureDate: lead.travelDate,
    });

    lead.pnr = pnr;
    lead.status = "PNR Sent";
    const response = await lead.save();

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
      .populate("claimed_by departure arrival airline");

    res.status(200).json({ message: "Successfully retrieved leads", leads });
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve leads", error });
  }
};

export const getAllConvertedLeads = async (req: Request, res: Response) => {
  try {
    const convertedLeads = await Lead.find({ converted: true })
      .sort({ createdAt: -1 }) // Sort by createdAt field in descending order
      .populate("claimed_by departure arrival airline");

    res.status(200).json({
      message: "Successfully retrieved converted leads",
      leads: convertedLeads,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to retrieve converted leads", error });
  }
};

// get all cancelled leads
export const getAllCancelledLeads = async (req: Request, res: Response) => {
  try {
    const cancelledLeads = await Lead.find({ cancelled: true })
      .sort({ createdAt: -1 }) // Sort by createdAt field in descending order
      .populate("claimed_by departure arrival airline");

    res.status(200).json({
      message: "Successfully retrieved converted leads",
      leads: cancelledLeads,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to retrieve converted leads", error });
  }
};

export const convertLead = async (req: Request, res: Response) => {
  try {
    const leadId = req.params.id;

    const lead = await Lead.findById(leadId);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    lead.converted = true;
    await lead.save();

    res.status(200).json({ message: "Lead converted successfully", lead });
  } catch (error) {
    res.status(500).json({ message: "Failed to convert lead", error });
  }
};

export const getLeadById = async (req: Request, res: Response) => {
  try {
    const leadId = req.params.id;

    const lead = await Lead.findById(leadId).populate(
      "claimed_by departure arrival airline call_logs.added_by"
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
      .populate("departure arrival claimed_by airline");

    res.status(200).json({ message: "Successfully retrieved leads", leads });
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve leads", error });
  }
};

// Search lead by email
export const searchLeadByEmail = async (req: Request, res: Response) => {
  try {
    const email = req.body.email;

    if (!email) {
      return res
        .status(400)
        .json({ message: "Email query parameter is required" });
    }

    const lead = await Lead.findOne({ email }).populate(
      "claimed_by departure arrival airline"
    );

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res.status(200).json({ message: "Successfully retrieved lead", lead });
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve lead", error });
  }
};
