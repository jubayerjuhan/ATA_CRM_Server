import { Request, Response } from "express";
import FacebookLead from "../models/facebookLead";
import { AuthorizedRequest } from "../types";

// Add a new lead
export const addFacebookLead = async (
  req: AuthorizedRequest,
  res: Response
): Promise<void> => {
  try {
    const lead = new FacebookLead(req.body);
    await lead.save();
    res.status(201).json(lead);
  } catch (error) {
    res.status(500).json({ message: "Error adding lead", error });
  }
};

// Get a single lead by ID
export const getFacebookLead = async (
  req: AuthorizedRequest,
  res: Response
): Promise<void> => {
  try {
    const lead = await FacebookLead.findById(req.params.id);
    if (!lead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }
    res.status(200).json(lead);
  } catch (error) {
    res.status(500).json({ message: "Error fetching lead", error });
  }
};

// Get leads for the authenticated user
export const getMyFacebookLeads = async (
  req: AuthorizedRequest,
  res: Response
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const leads = await FacebookLead.find({ userId: req.user.id });
    res.status(200).json(leads);
  } catch (error) {
    res.status(500).json({ message: "Error fetching leads", error });
  }
};

// Get all leads
export const getAllFacebookLeads = async (
  req: AuthorizedRequest,
  res: Response
): Promise<void> => {
  try {
    const leads = await FacebookLead.find();
    res.status(200).json(leads);
  } catch (error) {
    res.status(500).json({ message: "Error fetching leads", error });
  }
};

// Delete a lead by ID
export const deleteFacebookLead = async (
  req: AuthorizedRequest,
  res: Response
): Promise<void> => {
  try {
    const lead = await FacebookLead.findByIdAndDelete(req.params.id);
    if (!lead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }
    res.status(200).json({ message: "Lead deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting lead", error });
  }
};
