import { Request, Response } from "express";
import WhatsAppLead from "../models/whatsappLead";
import { AuthorizedRequest } from "../types";

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
      description,
      added_by: req.user?._id,
    });

    await newLead.save();
    res.status(201).json(newLead);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Controller to get all WhatsApp leads
export const getAllWhatsAppLeads = async (req: Request, res: Response) => {
  try {
    const leads = await WhatsAppLead.find();
    res.json(leads);
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

    const leads = await WhatsAppLead.find({ added_by }).populate(
      "added_by",
      "name email"
    );
    res.json(leads);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
