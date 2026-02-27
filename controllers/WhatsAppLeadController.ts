import { Request, Response } from "express";
import WhatsAppLead from "../models/whatsappLead";
import { AuthorizedRequest } from "../types";

const parsePositiveInt = (value: unknown, fallback: number) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

// Controller to add a WhatsApp lead
export const addWhatsAppLead = async (
  req: AuthorizedRequest,
  res: Response
) => {
  try {
    const { name, phone, description } = req.body;
    console.log(req.body);

    const newLead = new WhatsAppLead({
      name,
      phone,
      notes: [
        {
          text: description,
          added_by: req.user?._id,
        },
      ],
      added_by: req.user?._id,
    });

    await newLead.save();
    res.status(201).json(newLead);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Controller to get single lead with notes and added_by
export const getWhatsAppLead = async (
  req: AuthorizedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const lead = await WhatsAppLead.findById(id).populate(
      "added_by notes.added_by",
      "name email"
    );
    res.json(lead);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Controller to add a WhatsApp lead with notes
export const addWhatsAppLeadWithNotes = async (
  req: AuthorizedRequest,
  res: Response
) => {
  try {
    const { note } = req.body;
    const { id } = req.params;
    const lead = await WhatsAppLead.findByIdAndUpdate(
      id,
      {
        $push: {
          notes: {
            text: note,
            added_by: req.user?._id,
          },
        },
      },
      { new: true }
    );
    res.status(200).json(lead);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Controller to get all WhatsApp leads, sorted by latest added first
export const getAllWhatsAppLeads = async (req: Request, res: Response) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = clamp(parsePositiveInt(req.query.limit, 50), 1, 200);
    const all = String(req.query.all ?? "").toLowerCase() === "true";
    const search = String(req.query.search ?? "").trim();

    const query: Record<string, any> = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [totalCount, leads] = await Promise.all([
      WhatsAppLead.countDocuments(query),
      WhatsAppLead.find(query)
        .sort({ createdAt: -1 })
        .skip(all ? 0 : skip)
        .limit(all ? 0 : limit)
        .select({ name: 1, phone: 1, added_by: 1, createdAt: 1, notes: { $slice: -1 } })
        .populate("added_by", "name email")
        .lean(),
    ]);

    res.json({
      message: "Successfully retrieved WhatsApp leads",
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
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Controller to get WhatsApp leads added by a specific user
export const getWhatsAppLeadsByUser = async (
  req: AuthorizedRequest,
  res: Response
) => {
  try {
    const added_by = req.user?._id;

    if (!added_by) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const leads = await WhatsAppLead.find({
      added_by: added_by.toString(),
    })
      .sort({ createdAt: -1 })
      .populate("added_by", "name email");
    res.json(leads);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
