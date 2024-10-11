import { Request, Response } from "express";
import axios from "axios";
import Lead from "../models/lead";

const API_KEY = process.env.BREVO_API_KEY as string;

export const sendEmail = async (req: Request, res: Response) => {
  const { htmlContent, email, name, subject, leadId, emailType } = req.body;
  const apiKey = API_KEY;

  // lead status
  const status =
    emailType === "itinerary" ? "Itenary Email Sent" : "Ticket Sent";

  const emailData = {
    sender: {
      name: "ATA CRM",
      email: "jubayerjuhan.info@gmail.com",
    },
    to: [
      {
        email: email,
        name: name,
      },
    ],
    subject: subject,
    htmlContent: htmlContent,
  };

  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      emailData,
      {
        headers: {
          accept: "application/json",
          "api-key": apiKey,
          "content-type": "application/json",
        },
      }
    );

    const lead = await Lead.findById(leadId);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    lead.status = status;

    if (emailType === "itinerary") {
      lead.itenary_email_sent = true;
    } else {
      lead.ticket_sent = true;
    }
    await lead.save();

    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to send email", error });
    console.error("Error sending email:", error);
  }
};
