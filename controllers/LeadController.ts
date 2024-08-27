import { Request, Response } from "express";

import Lead from "../models/lead";

export const addLead = async (req: Request, res: Response) => {
  try {
    const leadData = req.body;

    const newLead = new Lead(leadData);
    await newLead.save();

    res
      .status(200)
      .json({ message: "Lead submitted successfully", data: newLead });
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
    const leads = await Lead.find().populate("claimed_by");

    res.status(200).json({ message: "Successfully retrieved leads", leads });
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve leads", error });
  }
};

export const getLeadById = async (req: Request, res: Response) => {
  try {
    const leadId = req.params.id;

    const lead = await Lead.findById(leadId).populate("claimed_by");

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res
      .status(200)
      .json({ message: "Successfully retrieved lead", data: lead });
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve lead", error });
  }
};

export const getLeadsByUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;

    const leads = await Lead.find({ claimed_by: userId });

    res.status(200).json({ message: "Successfully retrieved leads", leads });
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve leads", error });
  }
};
