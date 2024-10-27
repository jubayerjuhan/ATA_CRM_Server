import { Request, Response } from "express";
import axios from "axios";
import Lead from "../models/lead";

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ObjectCannedACL,
} from "@aws-sdk/client-s3";
import { v2 as cloudinary } from "cloudinary";
import { UploadApiResponse } from "cloudinary";

const API_KEY = process.env.BREVO_API_KEY as string;
const bucketName = "ata-ticket-uploads";

const s3Client = new S3Client({
  region: "ap-southeast-2", // e.g., "us-west-2"
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

export const sendEmail = async (req: Request, res: Response) => {
  const { htmlContent, email, name, subject, leadId, emailType } = req.body;
  const apiKey = API_KEY;

  const files = req?.files as Express.Multer.File[];
  const ticketUrls = await uploadTicket(files);

  // lead status
  const status =
    emailType === "itinerary" ? "Itenary Email Sent" : "Ticket Sent";

  let updatedHtmlContent = htmlContent;

  if (emailType === "ticket" && ticketUrls.length > 0) {
    const ticketButtons = ticketUrls
      .map(
        (url, index) => `
      <div style="margin: 10px 0;">
        <a href="${url}" target="_blank" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 4px 2px; cursor: pointer; border-radius: 5px;">
          View Ticket ${index + 1}
        </a>
      </div>
    `
      )
      .join("");

    const ticketSection = `
      <div style="margin-top: 20px; padding: 20px; background-color: #f8f8f8; border-radius: 5px;">
        <h2 style="color: #333;">Your Tickets</h2>
        <p>Here are your tickets. Click on each button to view or download:</p>
        ${ticketButtons}
      </div>
    `;

    updatedHtmlContent = `${htmlContent}${ticketSection}`;
  }

  console.log("Sending email to:", updatedHtmlContent);

  const emailData = {
    sender: {
      name: "Airways Travel",
      email: "info@airwaystravel.com.au",
    },
    to: [
      {
        email: email,
        name: name,
      },
    ],
    cc: [
      {
        email: "info@airwaystravel.com.au",
      },
    ],
    subject: subject,
    htmlContent: updatedHtmlContent,
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
    }
    if (emailType === "ticket") {
      lead.ticket_sent = true;
      lead.converted = true;
    }
    await lead.save();

    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to send email", error });
    console.error("Error sending email:", error);
  }
};

// Configure Cloudinary
cloudinary.config({
  cloud_name: "dh5uejkqb",
  api_key: "749534475976587",
  api_secret: "Fr-gC_dwK6Gebh8JBNygAPqBkzc",
});

const uploadTicket = async (
  files: Express.Multer.File[]
): Promise<string[]> => {
  try {
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const fileName = `${Date.now()}-${file.originalname}`;

        // Convert buffer to Base64
        const base64File = file.buffer.toString("base64");
        const dataURI = `data:${file.mimetype};base64,${base64File}`;

        // Upload to Cloudinary
        const result = await new Promise<UploadApiResponse>(
          (resolve, reject) => {
            cloudinary.uploader.upload(
              dataURI,
              {
                resource_type: "raw",
                public_id: fileName,
                tags: ["pdf", "ticket"],
                content_type: "application/pdf",
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result as UploadApiResponse);
              }
            );
          }
        );

        console.log(`File uploaded successfully: ${result.secure_url}`);
        return result.secure_url;
      })
    );

    return uploadedFiles;
  } catch (error) {
    console.error("Error uploading files:", error);
    throw error;
  }
};

const userAcknowledgementEmail = (lead: any) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <p style="color: #333;">Hello ${lead.firstName},</p>
      <p style="color: #333;">We have received your request and will get back to you shortly.</p>
      <p style="color: #333;">Your booking ID <strong>${lead.booking_id}</strong> has been acknowledged.</p>
      <p style="color: #333;">We will keep you updated on the progress of your request.</p>
      <p style="color: #333;">Thank you for choosing Us!</p>
    </div>
  `;
};

const adminNotificationEmail = (lead: any) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <p style="color: #333;">A new booking request has been acknowledged</p>
      <p style="color: #333;">A new booking request has been acknowledged with the following booking id :  ${lead.booking_id} </p>
      <p style="color: #333;">Please review and process this request as soon as possible.</p>
    </div>
  `;
};

export const sendAcknowledgementEmail = async (req: Request, res: Response) => {
  const { leadId } = req.body;

  const lead = await Lead.findById(leadId);

  if (!lead) {
    return res.status(404).json({ message: "Lead not found" });
  }

  const emailData = {
    sender: {
      name: "Airways Travel",
      email: "info@airwaystravel.com.au",
    },
    to: [
      {
        email: lead?.email,
        name: lead?.firstName,
      },
    ],
    cc: [
      {
        email: "info@airwaystravel.com.au",
      },
    ],
    subject: `Booking Acknowledgement - ${lead?.booking_id}`,
    htmlContent: userAcknowledgementEmail(lead),
  };

  // const notificationEmailData = {
  //   sender: {
  //     name: "Airways Travel",
  //     email: "info@airwaystravel.com.au",
  //   },
  //   to: [
  //     {
  //       email: "dropshipninja23@gmail.com",
  //     },
  //   ],
  //   subject: `Booking Acknowledgement - ${lead?.booking_id}`,
  //   htmlContent: adminNotificationEmail(lead),
  // };

  try {
    await axios.post("https://api.brevo.com/v3/smtp/email", emailData, {
      headers: {
        accept: "application/json",
        "api-key": API_KEY,
        "content-type": "application/json",
      },
    });
    // await axios.post(
    //   "https://api.brevo.com/v3/smtp/email",
    //   notificationEmailData,
    //   {
    //     headers: {
    //       accept: "application/json",
    //       "api-key": API_KEY,
    //       "content-type": "application/json",
    //     },
    //   }
    // );
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
