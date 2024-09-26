import { Request, Response } from "express";
import { render } from "@react-email/render";
import { Resend } from "resend";

import Lead from "../models/lead";
import { sendTicketConfirmationEmail } from "../services";
import { AuthorizedRequest } from "../types";
import { sendItineraryEmail } from "../services/email/itineraryEmail";
import axios from "axios";

const PNR_CONVERTER_API_URL = "https://api.pnrconverter.com/api";
const PNR_CONVERTER_PUBLIC_APP_KEY = process.env.PNR_CONVERTER_PUBLIC_APP_KEY;
const PNR_CONVERTER_PRIVATE_APP_KEY = process.env.PNR_CONVERTER_PRIVATE_APP_KEY;

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

// Send Itinerary Email

const convertPNR = async (pnr: string) => {
  console.log(pnr);
  try {
    const formData = new FormData();
    formData.append("pnr", pnr);

    const response = await axios({
      method: "post",
      url: PNR_CONVERTER_API_URL,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        PUBLIC_APP_KEY: PNR_CONVERTER_PUBLIC_APP_KEY,
        PRIVATE_APP_KEY: PNR_CONVERTER_PRIVATE_APP_KEY,
      },
      data: formData,
    });

    // Handle success
    // console.log("PNR Conversion Success:", response.data.flightData.flights);
    return response.data.flightData.flights;
    return response.data;
  } catch (error) {
    // Handle error
    console.error("Error converting PNR:", error);
    throw error;
  }
};

export const sendItineraryEmailController = async (
  req: Request,
  res: Response
) => {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { pnr } = req.body;
    console.log(pnr, "PNR");
    const leadId = req.params.id;

    const lead = await Lead.findById(leadId).populate("departure arrival");

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    const flights = await convertPNR(pnr);
    await sendItineraryEmail(lead.email, lead, flights);

    lead.pnr = pnr;
    lead.status = "Itenary Email Sent";
    lead.itenary_email_sent = true;
    await lead.save();

    res.status(200).json({ message: "Itinerary Email Sent Successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to send itinerary email", error });
  }
};
