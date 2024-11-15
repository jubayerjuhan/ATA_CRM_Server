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
      : `Your E-Ticket - Booking ID - ${lead?.booking_id}`;

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
          View E-Ticket ${index + 1}
        </a>
      </div>
    `
      )
      .join("");

    const ticketSection = `
    <div>
      <div style="margin-top: 20px;">
      <h2 style="color: #333;">Your E-Tickets</h2>
      <p>Here are your E-Tickets. Click on each button to view or download:</p>
      ${ticketButtons}
      <p style="margin-left:auto; margin-bottom: 10px; line-height: 34px"><span style="color: rgb(85,85,85); margin-top: 10px">Regards,</span>&nbsp;<br/></p>
    <p style="margin-left:auto; margin-bottom: 10px; line-height: 34px"><span style="color: rgb(85,85,85); margin-top: 10px">Airways Travel </span>&nbsp;<br/></p>
    <p style="margin-left:auto; margin-bottom: 10px; line-height: 34px"><span style="color: rgb(85,85,85); margin-top: 10px">8 Tallis cct Truganina 3029 </span>&nbsp;<br/></p>
    <p style="margin-left:auto; margin-bottom: 10px; line-height: 34px"><span style="color: rgb(85,85,85); margin-top: 10px">Toll Free 1300051525 </span>&nbsp;<br/></p>
    <p style="margin-left:auto; margin-bottom: 10px; line-height: 34px"><span style="color: rgb(85,85,85); margin-top: 10px">Phone     03-90413975</span>&nbsp;<br/></p>
        <div style="border-top: 1px solid #ccc; padding-top: 20px;">
    <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
      <tr>
        <td style="width: 150px; padding-right: 20px; border-right: 1px solid #ccc;">
          <img src="https://i.ibb.co.com/djZKDYG/unnamed-6.png" alt="Airways Travel Logo" style="width: 150px; height: 150px;">
        </td>
        <td style="vertical-align: top; padding-left: 20px;">
          <h2 style="color: #4a6ea9; margin: 0 0 10px;">Support Team</h2>
          <p style="margin: 0 0 5px;">
            <strong style="color: #4a6ea9;">Toll free</strong> 1300 051 525 <strong style="color: #4a6ea9;">Phone</strong> 03 9041 3975
          </p>
          <p style="margin: 0 0 5px;">
            <strong style="color: #4a6ea9;">Whatsapp</strong> 0432 936 702
          </p>
          <p style="margin: 0 0 5px;">
            <strong style="color: #4a6ea9;">Website</strong> www.airwaystravel.com.au
          </p>
          <p style="margin: 0 0 5px;">
            <strong style="color: #4a6ea9;">Email</strong> support@airwaystravel.com.au
          </p>
          <p style="margin: 0 0 10px;">
            <strong style="color: #4a6ea9;">Address</strong> 8 Tallis circuit Truganina Victoria 3029
          </p>
          <div>
            <a href="#" style="text-decoration: none; margin-right: 10px;">
              <img src="https://cdn4.iconfinder.com/data/icons/social-media-flat-7/64/Social-media_Tiktok-256.png" alt="TikTok" style="width: 24px; height: 24px;">
            </a>
            <a href="#" style="text-decoration: none; margin-right: 10px;">
              <img src="https://cdn1.iconfinder.com/data/icons/logotypes/32/square-facebook-256.png" alt="Facebook" style="width: 24px; height: 24px;">
            </a>
            <a href="#" style="text-decoration: none; margin-right: 10px;">
              <img src="https://cdn2.iconfinder.com/data/icons/social-icons-33/128/Instagram-512.png" alt="Instagram" style="width: 24px; height: 24px;">
            </a>
            <a href="#" style="text-decoration: none; margin-right: 10px;">
              <img src="https://cdn4.iconfinder.com/data/icons/social-media-black-white-2/1227/X-512.png" alt="X" style="width: 24px; height: 24px;">
            </a>
            <a href="#" style="text-decoration: none; margin-right: 10px;">
              <img src="https://cdn2.iconfinder.com/data/icons/social-media-2285/512/1_Youtube_colored_svg-512.png" alt="YouTube" style="width: 24px; height: 24px;">
            </a>
            <a href="#" style="text-decoration: none;">
              <img src="https://cdn2.iconfinder.com/data/icons/social-icons-33/128/Pinterest-512.png" alt="Pinterest" style="width: 24px; height: 24px;">
            </a>
          </div>
        </td>
      </tr>
    </table>
    <div style="margin-top: 20px; padding: 10px;">
      <p style="margin: 0; font-family: Arial, sans-serif; font-size: 18px; line-height: 1.2;">
        <span style="color: #ff0000; font-weight: bold;">NEW!</span>
        <span style="color: #1BA2EB;"> Join our Facebook group for Exclusive deals! </span>
        <a href="#" style="color: #ffffff; font-weight: bold; text-decoration: none;">GET NOW!</a>
      </p>
    </div>
  </div>
    </div>
      
    `;

    updatedHtmlContent = `

    <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>E-Ticket Email</title>
  </head>
  <body>
  ${htmlContent}${ticketSection}
  </body>
</html>

    `;
  }

  if (emailType === "itinerary") {
    updatedHtmlContent = `
    <div>
    <style>
    p{
      line-height: 1.5;
    }
    </style>
    <div>
    ${htmlContent}
      <div style="border-top: 1px solid #ccc; padding-top: 20px;">
      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
        <tr>
          <td style="width: 150px; padding-right: 20px; border-right: 1px solid #ccc;">
            <img src="https://i.ibb.co.com/djZKDYG/unnamed-6.png" alt="Airways Travel Logo" style="width: 150px; height: 150px;">
          </td>
          <td style="vertical-align: top; padding-left: 20px;">
            <h2 style="color: #4a6ea9; margin: 0 0 10px;">Support Team</h2>
            <p style="margin: 0 0 5px;">
              <strong style="color: #4a6ea9;">Toll free</strong> 1300 051 525 <strong style="color: #4a6ea9;">Phone</strong> 03 9041 3975
            </p>
            <p style="margin: 0 0 5px;">
              <strong style="color: #4a6ea9;">Whatsapp</strong> 0432 936 702
            </p>
            <p style="margin: 0 0 5px;">
              <strong style="color: #4a6ea9;">Website</strong> www.airwaystravel.com.au
            </p>
            <p style="margin: 0 0 5px;">
              <strong style="color: #4a6ea9;">Email</strong> support@airwaystravel.com.au
            </p>
            <p style="margin: 0 0 10px;">
              <strong style="color: #4a6ea9;">Address</strong> 8 Tallis circuit Truganina Victoria 3029
            </p>
            <div>
              <a href="#" style="text-decoration: none; margin-right: 10px;">
                <img src="https://cdn4.iconfinder.com/data/icons/social-media-flat-7/64/Social-media_Tiktok-256.png" alt="TikTok" style="width: 24px; height: 24px;">
              </a>
              <a href="#" style="text-decoration: none; margin-right: 10px;">
                <img src="https://cdn1.iconfinder.com/data/icons/logotypes/32/square-facebook-256.png" alt="Facebook" style="width: 24px; height: 24px;">
              </a>
              <a href="#" style="text-decoration: none; margin-right: 10px;">
                <img src="https://cdn2.iconfinder.com/data/icons/social-icons-33/128/Instagram-512.png" alt="Instagram" style="width: 24px; height: 24px;">
              </a>
              <a href="#" style="text-decoration: none; margin-right: 10px;">
                <img src="https://cdn4.iconfinder.com/data/icons/social-media-black-white-2/1227/X-512.png" alt="X" style="width: 24px; height: 24px;">
              </a>
              <a href="#" style="text-decoration: none; margin-right: 10px;">
                <img src="https://cdn2.iconfinder.com/data/icons/social-media-2285/512/1_Youtube_colored_svg-512.png" alt="YouTube" style="width: 24px; height: 24px;">
              </a>
              <a href="#" style="text-decoration: none;">
                <img src="https://cdn2.iconfinder.com/data/icons/social-icons-33/128/Pinterest-512.png" alt="Pinterest" style="width: 24px; height: 24px;">
              </a>
            </div>
          </td>
        </tr>
      </table>
      <div style="margin-top: 20px; padding: 10px;">
        <p style="margin: 0; font-family: Arial, sans-serif; font-size: 18px; line-height: 1.2;">
          <span style="color: #ff0000; font-weight: bold;">NEW!</span>
          <span style="color: #1BA2EB;"> Join our Facebook group for Exclusive deals! </span>
          <a href="#" style="color: #ffffff; font-weight: bold; text-decoration: none;">GET NOW!</a>
        </p>
      </div>
    </div>
    </div>
    </div>`;
  }

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
  <div style="font-family: Arial, sans-serif; text-align: left;margin: 0 auto; padding: 20px; font-size: 14px;">
    <p style="color: #333;">Hello ${lead.firstName},</p>
    <p style="color: #333;">We have received your payment method selection for booking ID <strong>${lead.booking_id}</strong>. </p>
    <p style="color: #333;">Your selected payment method is <strong>${lead.selectedPaymentMethod}.</strong>
    </p>
    <p style="color: #333;">Thank you for choosing Us!</p>
  </div>
  <div style="border-top: 1px solid #ccc; padding-top: 20px;">
      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
        <tr>
          <td style="width: 150px; padding-right: 20px; border-right: 1px solid #ccc;">
            <img src="https://i.ibb.co.com/djZKDYG/unnamed-6.png" alt="Airways Travel Logo" style="width: 150px; height: 150px;">
          </td>
          <td style="vertical-align: top; padding-left: 20px;">
            <h2 style="color: #4a6ea9; margin: 0 0 10px;">Support Team</h2>
            <p style="margin: 0 0 5px;">
              <strong style="color: #4a6ea9;">Toll free</strong> 1300 051 525 <strong style="color: #4a6ea9;">Phone</strong> 03 9041 3975
            </p>
            <p style="margin: 0 0 5px;">
              <strong style="color: #4a6ea9;">Whatsapp</strong> 0432 936 702
            </p>
            <p style="margin: 0 0 5px;">
              <strong style="color: #4a6ea9;">Website</strong> www.airwaystravel.com.au
            </p>
            <p style="margin: 0 0 5px;">
              <strong style="color: #4a6ea9;">Email</strong> support@airwaystravel.com.au
            </p>
            <p style="margin: 0 0 10px;">
              <strong style="color: #4a6ea9;">Address</strong> 8 Tallis circuit Truganina Victoria 3029
            </p>
            <div>
              <a href="#" style="text-decoration: none; margin-right: 10px;">
                <img src="https://cdn4.iconfinder.com/data/icons/social-media-flat-7/64/Social-media_Tiktok-256.png" alt="TikTok" style="width: 24px; height: 24px;">
              </a>
              <a href="#" style="text-decoration: none; margin-right: 10px;">
                <img src="https://cdn1.iconfinder.com/data/icons/logotypes/32/square-facebook-256.png" alt="Facebook" style="width: 24px; height: 24px;">
              </a>
              <a href="#" style="text-decoration: none; margin-right: 10px;">
                <img src="https://cdn2.iconfinder.com/data/icons/social-icons-33/128/Instagram-512.png" alt="Instagram" style="width: 24px; height: 24px;">
              </a>
              <a href="#" style="text-decoration: none; margin-right: 10px;">
                <img src="https://cdn4.iconfinder.com/data/icons/social-media-black-white-2/1227/X-512.png" alt="X" style="width: 24px; height: 24px;">
              </a>
              <a href="#" style="text-decoration: none; margin-right: 10px;">
                <img src="https://cdn2.iconfinder.com/data/icons/social-media-2285/512/1_Youtube_colored_svg-512.png" alt="YouTube" style="width: 24px; height: 24px;">
              </a>
              <a href="#" style="text-decoration: none;">
                <img src="https://cdn2.iconfinder.com/data/icons/social-icons-33/128/Pinterest-512.png" alt="Pinterest" style="width: 24px; height: 24px;">
              </a>
            </div>
          </td>
        </tr>
      </table>
      <div style="margin-top: 20px; padding: 10px;">
        <p style="margin: 0; font-family: Arial, sans-serif; font-size: 18px; line-height: 1.2;">
          <span style="color: #ff0000; font-weight: bold;">NEW!</span>
          <span style="color: #1BA2EB;"> Join our Facebook group for Exclusive deals! </span>
          <a href="#" style="color: #ffffff; font-weight: bold; text-decoration: none;">GET NOW!</a>
        </p>
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
