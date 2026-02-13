import { Request, Response } from "express";
import FacebookLead from "../models/facebookLead";
import { AuthorizedRequest } from "../types";

const parsePositiveInt = (value: unknown, fallback: number) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

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
    const page = parsePositiveInt(req.query.page, 1);
    const limit = clamp(parsePositiveInt(req.query.limit, 50), 1, 200);
    const all = String(req.query.all ?? "").toLowerCase() === "true";
    const search = String(req.query.search ?? "").trim();

    const query: Record<string, any> = {};
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [totalCount, leads] = await Promise.all([
      FacebookLead.countDocuments(query),
      FacebookLead.find(query)
        .sort({ createdAt: -1 })
        .skip(all ? 0 : skip)
        .limit(all ? 0 : limit)
        .lean(),
    ]);

    res.status(200).json({
      message: "Successfully retrieved facebook leads",
      leads,
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

// mark as added
export const markFacebookLeadAsAdded = async (
  req: AuthorizedRequest,
  res: Response
): Promise<void> => {
  try {
    const lead = await FacebookLead.findByIdAndUpdate(req.params.id, {
      added: true,
    });
    if (!lead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }
    res.status(200).json({ message: "Lead marked as added" });
  } catch (error) {
    res.status(500).json({ message: "Error marking lead as added", error });
  }
};
