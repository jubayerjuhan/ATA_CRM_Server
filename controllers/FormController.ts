import { NextFunction, Request, Response } from "express";

import FormField from "../models/formField";

const parsePositiveInt = (value: unknown, fallback: number) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const addFormField = async (req: Request, res: Response) => {
  try {
    const { name, type, label, required } = req.body;

    const newField = new FormField({ name, type, label, required });
    await newField.save();

    res
      .status(201)
      .json({ message: "Field added successfully", data: newField });
  } catch (error) {
    res.status(500).json({ message: "Failed to add field", error });
  }
};

export const getAllFormFields = async (req: Request, res: Response) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = clamp(parsePositiveInt(req.query.limit, 50), 1, 200);
    const all = String(req.query.all ?? "").toLowerCase() === "true";
    const search = String(req.query.search ?? "").trim();

    const query: Record<string, any> = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { label: { $regex: search, $options: "i" } },
        { type: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [totalCount, formFields] = await Promise.all([
      FormField.countDocuments(query),
      FormField.find(query)
        .sort({ createdAt: -1 })
        .skip(all ? 0 : skip)
        .limit(all ? 0 : limit)
        .lean(),
    ]);

    res.status(200).json({
      message: "Successfully retrieved form fields",
      formFields,
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
    res.status(500).json({ message: "Failed to retrieve form fields", error });
  }
};

export const editFormField = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, label, required } = req.body;

    const updatedField = await FormField.findByIdAndUpdate(
      id,
      { name, type, label, required },
      { new: true }
    );

    if (!updatedField) {
      return res.status(404).json({ message: "Field not found" });
    }

    res.json({ message: "Field updated successfully", data: updatedField });
  } catch (error) {
    res.status(500).json({ message: "Failed to update field", error });
  }
};

export const deleteFormField = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedField = await FormField.findByIdAndDelete(id);

    if (!deletedField) {
      return res.status(404).json({ message: "Field not found" });
    }

    res.json({ message: "Field deleted successfully", data: deletedField });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete field", error });
  }
};
