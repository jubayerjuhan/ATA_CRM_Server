import { Resend } from "resend";
import { render } from "@react-email/render";
import brevo from "@getbrevo/brevo";
import moment from "moment";
import axios from "axios";

const API_KEY = process.env.BREVO_API_KEY as string;
const API_URL = "https://api.sendinblue.com/v3/smtp/email";

export const ticketSendingEmail = async (
  email: string,
  ticketLinks: any,
  lead: any
) => {
  const COMPANY_NAME = process.env.COMPANY_NAME
    ? process.env.COMPANY_NAME
    : "ATA CRM";

  const data = {
    to: [{ email }],
    bcc: [{ email: "support@airwaystravel.com.au" }],
    templateId: 13, // Replace with your actual template ID
    params: {
      name: lead.firstName,
      ticketLinks: ticketLinks,
      companyName: COMPANY_NAME,
    },
  };

  const config = {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "api-key": API_KEY,
    },
  };

  //Calling the Api to send the email
  try {
    const response = await axios.post(API_URL, data, config);
    console.log("Email sent successfully. MessageId:", response.data.messageId);
    return response.data;
  } catch (error: any) {
    console.error(
      "Error sending email:",
      error.response ? error.response.data : error.message
    );
  }
};
