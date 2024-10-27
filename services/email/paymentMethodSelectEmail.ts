import { Resend } from "resend";
import { render } from "@react-email/render";
import brevo from "@getbrevo/brevo";
import moment from "moment";
import axios from "axios";

const API_KEY = process.env.BREVO_API_KEY as string;
const API_URL = "https://api.sendinblue.com/v3/smtp/email";

const FRONTEND_URL_PROD = process.env.FRONTEND_URL_PROD;

function transformObjectKeys(obj: any) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      // Split the key by underscore
      const parts = key.split("_");
      // Capitalize the first part
      parts[0] = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      // If there's a number, add a space before it
      if (parts[1]) {
        return [parts[0] + " " + parts[1], value];
      }
      // If there's no number, just return the capitalized word
      return [parts[0], value];
    })
  );
}

export const sendPaymentMethodSelectorEmail = async (
  email: string,
  lead: any
) => {
  const COMPANY_NAME = process.env.COMPANY_NAME
    ? process.env.COMPANY_NAME
    : "ATA CRM";

  // Flight data

  // Convert the Mongoose Map type to a plain object
  const quotedAmount =
    lead.quoted_amount instanceof Map
      ? Object.fromEntries(lead.quoted_amount)
      : lead.quoted_amount;

  const data = {
    to: [{ email }],
    templateId: 12, // Replace with your actual template ID
    params: {
      companyName: COMPANY_NAME,
      name: lead.firstName,
    },
  };

  console.log(data, "data");

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
