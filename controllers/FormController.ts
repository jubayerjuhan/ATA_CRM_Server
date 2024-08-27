import { NextFunction, Request, Response } from "express";

import FormField from "../models/formField";

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
    const formFields = await FormField.find();

    res.status(200).json({
      message: "Successfully retrieved form fields",
      formFields,
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
