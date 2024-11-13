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
  const { htmlContent, email, name, leadId, emailType } = req.body;
  const apiKey = API_KEY;

  const files = req?.files as Express.Multer.File[];
  const ticketUrls = await uploadTicket(files);

  const lead = await Lead.findById(leadId);
  const subject =
    emailType === "itinerary"
      ? `Your Payment Link - Booking ID - ${lead?.booking_id}`
      : `Your e-Ticket - Booking ID - ${lead?.booking_id}`;

  // lead status
  const status =
    emailType === "itinerary" ? `Itenary Email Sent` : `Ticket Sent`;

  let updatedHtmlContent = htmlContent;

  if (emailType === "ticket" && ticketUrls.length > 0) {
    const ticketButtons = ticketUrls
      .map(
        (url, index) => `
      <div style="margin: 10px 0;">
        <a href="${url}" target="_blank" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 4px 2px; cursor: pointer; border-radius: 5px;">
          View e-Ticket ${index + 1}
        </a>
      </div>
    `
      )
      .join("");

    const ticketSection = `
    <div>
      <div style="margin-top: 20px; padding: 20px; background-color: #f8f8f8; border-radius: 5px;">
      <h2 style="color: #333;">Your e-Tickets</h2>
      <p>Here are your e-tickets. Click on each button to view or download:</p>
      ${ticketButtons}
      </div>
      <div
  style="
    font-family: Arial, sans-serif;
    max-width: 600px;
    margin: auto;
    padding: 20px;
    color: #333;
  "
>
  <div
    style="
      text-align: left;
      display: flex;
      flex-direction: row;
      align-items: center;
    "
  >
    <img
      src="https://i.ibb.co.com/rvdQZqt/unnamed-6.png"
      alt="Airways travel Logo"
      style="
        width: 150px;
        height: 150px;
        max-height: 150px;
        max-width: 150px;
        margin-right: 15px;
        object-fit: contain;
      "
    />
    <div>
      <h2 style="margin: 0; color: #990000">Airways Travel</h2>
      <p style="margin: 0; color: #666">Airways Travel, Excellence in Travel</p>
    </div>
  </div>
  <div style="clear: both; padding-top: 20px; color: #333">
    <p style="margin: 0; line-height: 24px">
      <strong>Phone:</strong> 03 9041 3975 &nbsp;&nbsp;
      <strong>WhatsApp:</strong> 0432 936 702<br />
      <strong>Website:</strong>
      <a
        href="https://airwaystravel.com.au"
        style="color: #990000; text-decoration: none"
        >airwaystravel.com.au</a
      >
      &nbsp;&nbsp; <strong>Email:</strong>
      <a
        href="mailto:admin@airwaystravel.com.au"
        style="color: #990000; text-decoration: none"
        >admin@airwaystravel.com.au</a
      ><br />
      <strong>Address:</strong> 8 Tallis Cct, Truganina VIC 3029
    </p>
  </div>
  <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0" />
  <img
    src="https://i.ibb.co.com/vDJMqLW/unnamed-7.png"
    alt="Banner Image"
    style="width: 100%; border-radius: 10px"
  />
  <div style="text-align: left; margin-top: 20px">
    <p style="font-size: 12px; color: #999">
      IMPORTANT: The contents of this email and any attachments are
      confidential. They are intended for the named recipient(s) only. If you
      have received this email by mistake, please notify the sender immediately
      and do not disclose the contents to anyone or make copies thereof.
    </p>
    <div style="margin-top: 20px">
      <a
        href="https://airwaystravel.com.au"
        style="text-decoration: none; color: #333; font-size: 13px"
      >
        ⭐ How did we do? <span style="color: #990000">Give us a review</span>
      </a>
      <br />
      <a
        href="https://airwaystravel.com.au"
        style="text-decoration: none; color: #333; font-size: 13px"
      >
        📧 Subscribe Now!
        <span style="color: #990000">Don’t miss a bargain</span>
      </a>
    </div>
  </div>
</div>
    </div>
    `;

    updatedHtmlContent = `${htmlContent}${ticketSection}`;
  }

  console.log("Sending email to:", updatedHtmlContent);

  const emailData = {
    sender: {
      name: "Airways Travel",
      email: "support@airwaystravel.com.au",
    },
    to: [
      {
        email: email,
        name: name,
      },
    ],
    cc: [
      {
        email: "support@airwaystravel.com.au",
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
  <div>
  </div>
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <p style="color: #333;">Hello ${lead.firstName},</p>
      <p style="color: #333;">Your booking ID <strong>${lead.booking_id}</strong> has been acknowledged.</p>
      <p style="color: #333;">We will keep you updated on the progress of your request.</p>
      <p style="color: #333;">Thank you for choosing Us!</p>
    </div>
    <div
  style="
    font-family: Arial, sans-serif;
    max-width: 600px;
    margin: auto;
    padding: 20px;
    color: #333;
  "
>
  <div
    style="
      text-align: left;
      display: flex;
      flex-direction: row;
      align-items: center;
    "
  >
    <img
      src="https://i.ibb.co.com/rvdQZqt/unnamed-6.png"
      alt="Airways travel Logo"
      style="
        width: 150px;
        height: 150px;
        max-height: 150px;
        max-width: 150px;
        margin-right: 15px;
        object-fit: contain;
      "
    />
    <div>
      <h2 style="margin: 0; color: #990000">Airways Travel</h2>
      <p style="margin: 0; color: #666">Airways Travel, Excellence in Travel</p>
    </div>
  </div>
  <div style="clear: both; padding-top: 20px; color: #333">
    <p style="margin: 0; line-height: 24px">
      <strong>Phone:</strong> 03 9041 3975 &nbsp;&nbsp;
      <strong>WhatsApp:</strong> 0432 936 702<br />
      <strong>Website:</strong>
      <a
        href="https://airwaystravel.com.au"
        style="color: #990000; text-decoration: none"
        >airwaystravel.com.au</a
      >
      &nbsp;&nbsp; <strong>Email:</strong>
      <a
        href="mailto:admin@airwaystravel.com.au"
        style="color: #990000; text-decoration: none"
        >admin@airwaystravel.com.au</a
      ><br />
      <strong>Address:</strong> 8 Tallis Cct, Truganina VIC 3029
    </p>
  </div>
  <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0" />
  <img
    src="https://i.ibb.co.com/vDJMqLW/unnamed-7.png"
    alt="Banner Image"
    style="width: 100%; border-radius: 10px"
  />
  <div style="text-align: left; margin-top: 20px">
    <p style="font-size: 12px; color: #999">
      IMPORTANT: The contents of this email and any attachments are
      confidential. They are intended for the named recipient(s) only. If you
      have received this email by mistake, please notify the sender immediately
      and do not disclose the contents to anyone or make copies thereof.
    </p>
    <div style="margin-top: 20px">
      <a
        href="https://airwaystravel.com.au"
        style="text-decoration: none; color: #333; font-size: 13px"
      >
        ⭐ How did we do? <span style="color: #990000">Give us a review</span>
      </a>
      <br />
      <a
        href="https://airwaystravel.com.au"
        style="text-decoration: none; color: #333; font-size: 13px"
      >
        📧 Subscribe Now!
        <span style="color: #990000">Don’t miss a bargain</span>
      </a>
    </div>
  </div>
</div>
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
      email: "support@airwaystravel.com.au",
    },
    to: [
      {
        email: lead?.email,
        name: lead?.firstName,
      },
    ],
    cc: [
      {
        email: "support@airwaystravel.com.au",
      },
    ],
    subject: `Booking Acknowledgement - ${lead?.booking_id}`,
    htmlContent: userAcknowledgementEmail(lead),
  };

  // const notificationEmailData = {
  //   sender: {
  //     name: "Airways Travel",
  //     email: "support@airwaystravel.com.au",
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

export const sendPaymentMethodSelectionEmail = async (
  req: Request,
  res: Response
) => {
  const { leadId } = req.body;

  const lead = await Lead.findById(leadId);

  if (!lead) {
    return res.status(404).json({ message: "Lead not found" });
  }

  const emailData = {
    sender: {
      name: "Airways Travel",
      email: "support@airwaystravel.com.au",
    },
    to: [
      {
        email: lead?.email,
        name: lead?.firstName,
      },
    ],
    cc: [
      {
        email: "support@airwaystravel.com.au",
      },
    ],
    subject: `Payment Method Selection - ${lead?.booking_id}`,
    htmlContent: `
    <div>
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p style="color: #333;">Hello ${lead.firstName},</p>
        <p style="color: #333;">We have received your payment method selection for booking ID <strong>${lead.booking_id}</strong>.</p>
        <p style="color: #333;">Your selected payment method is <strong>${lead.selectedPaymentMethod}.</strong></p>
        <p style="color: #333;">Thank you for choosing Us!</p>
      </div>

      <div
  style="
    font-family: Arial, sans-serif;
    max-width: 600px;
    margin: auto;
    padding: 20px;
    color: #333;
  "
>
  <div
    style="
      text-align: left;
      display: flex;
      flex-direction: row;
      align-items: center;
    "
  >
    <img
      src="https://i.ibb.co.com/rvdQZqt/unnamed-6.png"
      alt="Airways travel Logo"
      style="
        width: 150px;
        height: 150px;
        max-height: 150px;
        max-width: 150px;
        margin-right: 15px;
        object-fit: contain;
      "
    />
    <div>
      <h2 style="margin: 0; color: #990000">Airways Travel</h2>
      <p style="margin: 0; color: #666">Airways Travel, Excellence in Travel</p>
    </div>
  </div>
  <div style="clear: both; padding-top: 20px; color: #333">
    <p style="margin: 0; line-height: 24px">
      <strong>Phone:</strong> 03 9041 3975 &nbsp;&nbsp;
      <strong>WhatsApp:</strong> 0432 936 702<br />
      <strong>Website:</strong>
      <a
        href="https://airwaystravel.com.au"
        style="color: #990000; text-decoration: none"
        >airwaystravel.com.au</a
      >
      &nbsp;&nbsp; <strong>Email:</strong>
      <a
        href="mailto:admin@airwaystravel.com.au"
        style="color: #990000; text-decoration: none"
        >admin@airwaystravel.com.au</a
      ><br />
      <strong>Address:</strong> 8 Tallis Cct, Truganina VIC 3029
    </p>
  </div>
  <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0" />
  <img
    src="https://i.ibb.co.com/vDJMqLW/unnamed-7.png"
    alt="Banner Image"
    style="width: 100%; border-radius: 10px"
  />
  <div style="text-align: left; margin-top: 20px">
    <p style="font-size: 12px; color: #999">
      IMPORTANT: The contents of this email and any attachments are
      confidential. They are intended for the named recipient(s) only. If you
      have received this email by mistake, please notify the sender immediately
      and do not disclose the contents to anyone or make copies thereof.
    </p>
    <div style="margin-top: 20px">
      <a
        href="https://airwaystravel.com.au"
        style="text-decoration: none; color: #333; font-size: 13px"
      >
        ⭐ How did we do? <span style="color: #990000">Give us a review</span>
      </a>
      <br />
      <a
        href="https://airwaystravel.com.au"
        style="text-decoration: none; color: #333; font-size: 13px"
      >
        📧 Subscribe Now!
        <span style="color: #990000">Don’t miss a bargain</span>
      </a>
    </div>
  </div>
</div>
    </div>
    `,
  };

  try {
    await axios.post("https://api.brevo.com/v3/smtp/email", emailData, {
      headers: {
        accept: "application/json",
        "api-key": API_KEY,
        "content-type": "application/json",
      },
    });

    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to send email", error });
  }
};
