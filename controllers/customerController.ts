import { Request, Response } from "express";
import { render } from "@react-email/render";
import { Resend } from "resend";
import Stripe from "stripe";

import Lead from "../models/lead";
import { sendTicketConfirmationEmail } from "../services";
import { AuthorizedRequest } from "../types";
import { sendItineraryEmail } from "../services/email/itineraryEmail";
import axios from "axios";
import moment from "moment";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ObjectCannedACL,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ticketSendingEmail } from "../services/email/ticketSendingEmail";

const s3Client = new S3Client({
  region: "ap-southeast-2", // e.g., "us-west-2"
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});
const PNR_CONVERTER_API_URL = "https://api.pnrconverter.com/api";
const PNR_CONVERTER_PUBLIC_APP_KEY = process.env.PNR_CONVERTER_PUBLIC_APP_KEY;
const PNR_CONVERTER_PRIVATE_APP_KEY = process.env.PNR_CONVERTER_PRIVATE_APP_KEY;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20", // Use the latest API version
});

export const getAllCustomers = async (
  req: AuthorizedRequest,
  res: Response
) => {
  try {
    const customers = await Lead.find({
      claimed_by: { $exists: true },
    }).populate("claimed_by departure arrival airline");
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

    console.log(quotedAmount, "Quoted Amount");

    const leadId = req.params.id;

    const lead = await Lead.findById(leadId);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    // create stripe checkout session here
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      metadata: { leadId },
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: quotedAmount.total * 100,
            product_data: {
              name: "Payment",
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL_PROD}/payment-success`,
      cancel_url: `${process.env.FRONTEND_URL_PROD}/payment-failed`,
    });

    lead.quoted_amount = quotedAmount;
    lead.stripe_payment_link = session.url;

    console.log(lead, "Lead");
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

    // Sending The Itinerary Email
    await sendItineraryEmail(
      lead.email,
      lead.first_name,
      leadId,
      flights,
      lead
    );
    lead.pnr = pnr;
    lead.status = "Itenary Email Sent";
    lead.itenary_email_sent = true;
    await lead.save();

    res.status(200).json({ message: "Itinerary Email Sent Successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to send itinerary email", error });
  }
};

// Get Customer By Date
export const getCustomersByDate = async (
  req: AuthorizedRequest,
  res: Response
) => {
  const { startDate, endDate } = req.query;

  // Check if both startDate and endDate are provided
  if (!startDate || !endDate) {
    return res
      .status(400)
      .json({ message: "Please provide both startDate and endDate" });
  }

  try {
    // Parse startDate and endDate using moment to ensure valid date objects
    const start = moment(startDate as string, moment.ISO_8601, true).startOf(
      "day"
    );
    const end = moment(endDate as string, moment.ISO_8601, true).endOf("day");

    if (!start.isValid() || !end.isValid()) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    // Query the leads where the payment date falls within the range
    const leads = await Lead.find({
      "payment.date": {
        $gte: start.toDate(),
        $lte: end.toDate(),
      },
      "payment.status": "completed",
      converted: true,
    });

    // Query the leads where the payment date falls within the range and status is cancelled
    const cancelledLeads = await Lead.find({
      "payment.date": {
        $gte: start.toDate(),
        $lte: end.toDate(),
      },
      converted: false,
      cancelled: true,
    });

    // also see how many followups I have on that day
    const followups = await Lead.find({
      follow_up_date: {
        $gte: start.toDate(),
        $lte: end.toDate(),
      },
    });

    // my followups
    const myFollowups = await Lead.find({
      follow_up_date: {
        $gte: start.toDate(),
        $lte: end.toDate(),
      },
      claimed_by: req.user?._id as string,
    });

    // loop through the leads and please make the sum of the total amount quoted_amount.total
    let totalAmount = 0;

    leads.forEach((lead) => {
      totalAmount += lead.quoted_amount.get("total");
    });

    // Return the filtered leads
    res.status(200).json({
      message: "Leads retrieved successfully",
      leads,
      cancelledLeads,
      followups: followups.length,
      myFollowups: myFollowups.length,
      totalAmount,
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// make a route to cancel a booking
export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const leadId = req.params.id;

    const lead = await Lead.findById(leadId);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    // Update the lead status to cancelled
    lead.status = "Cancelled";
    lead.cancelled = true;
    lead.converted = false;

    await lead.save();

    res.status(200).json({ message: "Booking cancelled successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to cancel booking", error });
  }
};

// Send the ticket in email
export const sendTicketEmail = async (req: Request, res: Response) => {
  if (!req?.files || req.files?.length === 0) {
    return res.status(400).send("No files uploaded.");
  }

  const files = req?.files as Express.Multer.File[];
  const bucketName = "ata-ticket-uploads";

  try {
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const fileName = `${Date.now()}-${file.originalname}`;

        const uploadParams = {
          Bucket: bucketName,
          Key: fileName,
          Body: file.buffer,
          ACL: ObjectCannedACL.public_read, // Makes the file publicly accessible
          ContentType: "application/pdf",
          ContentDisposition: "inline", // Displays the file inline in the browser
        };

        await s3Client.send(new PutObjectCommand(uploadParams));

        // Generate the public URL for the uploaded file
        return `https://${bucketName}.s3.amazonaws.com/${fileName}`;
      })
    );
    const leadId = req.params.id;
    const lead = await Lead.findById(leadId);

    console.log(lead?.email, "Lead Email");

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    // Send the ticket email
    await ticketSendingEmail(lead.email, uploadedFiles, lead);

    lead.ticket_links = uploadedFiles;
    lead.ticket_sent = true;
    lead.status = "Ticket Sent";
    await lead.save();

    res.status(200).json({
      message: "Ticket email sent successfully",
    });
  } catch (error) {
    console.log(error, "Error...");
    console.error("Error uploading files:", error);
    res.status(500).send("Error uploading files");
  }
};
